"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState, useTransition } from "react";
import {
  createCommunityCommentFastAction,
  deleteCommunityCommentFastAction,
  toggleCommunityFeaturedFastAction,
  toggleCommunityLikeFastAction,
} from "@/app/community/actions";
import type { CommunityComment, CommunityPost, CurrentUser } from "@/lib/types";
import { formatDate } from "@/lib/utils";

type Props = {
  post: CommunityPost;
  comments: CommunityComment[];
  user: CurrentUser | null;
  canWriteComment: boolean;
};

function getCommentDraft(user: CurrentUser, postId: string, content: string, parentId: string | null): CommunityComment {
  return {
    id: `draft-${crypto.randomUUID()}`,
    post_id: postId,
    parent_id: parentId,
    author_id: user.id,
    author_name: user.profile?.minecraft_name || user.name,
    author_avatar_url: user.profile?.minecraft_uuid
      ? `https://mc-heads.net/avatar/${user.profile.minecraft_uuid}/64`
      : user.avatarUrl,
    content,
    created_at: new Date().toISOString(),
  };
}

export function CommunityPostInteractions({ post, comments, user, canWriteComment }: Props) {
  const [isPending, startTransition] = useTransition();
  const [liked, setLiked] = useState(Boolean(post.liked_by_current_user));
  const [likeCount, setLikeCount] = useState(post.like_count ?? 0);
  const [featured, setFeatured] = useState(Boolean(post.featured));
  const [localComments, setLocalComments] = useState(comments);
  const [commentText, setCommentText] = useState("");
  const [activeReplyTarget, setActiveReplyTarget] = useState<CommunityComment | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const commentCountLabel = useMemo(() => localComments.length.toLocaleString("ko-KR"), [localComments.length]);
  const { rootComments, repliesByParent } = useMemo(() => {
    const roots: CommunityComment[] = [];
    const replies = new Map<string, CommunityComment[]>();

    for (const comment of localComments) {
      if (comment.parent_id) {
        const group = replies.get(comment.parent_id) ?? [];
        group.push(comment);
        replies.set(comment.parent_id, group);
      } else {
        roots.push(comment);
      }
    }

    return { rootComments: roots, repliesByParent: replies };
  }, [localComments]);

  function runAction(action: () => Promise<void>, onError?: () => void) {
    setErrorMessage(null);
    startTransition(async () => {
      try {
        await action();
      } catch (error) {
        onError?.();
        setErrorMessage(error instanceof Error ? error.message : "처리 중 오류가 발생했습니다.");
      }
    });
  }

  function handleLike() {
    if (!user || isPending) {
      return;
    }

    const previousLiked = liked;
    const previousCount = likeCount;
    const nextLiked = !liked;
    setLiked(nextLiked);
    setLikeCount(Math.max(0, likeCount + (nextLiked ? 1 : -1)));

    runAction(
      async () => {
        const formData = new FormData();
        formData.set("post_id", post.id);
        formData.set("slug", post.slug);
        const result = await toggleCommunityLikeFastAction(formData);
        setLiked(result.liked);
        setLikeCount(result.likeCount);
      },
      () => {
        setLiked(previousLiked);
        setLikeCount(previousCount);
      },
    );
  }

  function handleFeatured() {
    if (!user?.isAdmin || isPending) {
      return;
    }

    const previousFeatured = featured;
    const nextFeatured = !featured;
    setFeatured(nextFeatured);

    runAction(
      async () => {
        const formData = new FormData();
        formData.set("id", post.id);
        formData.set("slug", post.slug);
        formData.set("featured", String(previousFeatured));
        const result = await toggleCommunityFeaturedFastAction(formData);
        setFeatured(result.featured);
      },
      () => setFeatured(previousFeatured),
    );
  }

  function handleCommentSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user || isPending) {
      return;
    }

    const content = commentText.trim();
    if (!content) {
      return;
    }

    const parentId = activeReplyTarget?.parent_id ?? activeReplyTarget?.id ?? null;
    const draft = getCommentDraft(user, post.id, content, parentId);
    setCommentText("");
    setActiveReplyTarget(null);
    setLocalComments((current) => [...current, draft]);

    runAction(
      async () => {
        const formData = new FormData();
        formData.set("post_id", post.id);
        formData.set("slug", post.slug);
        if (parentId) {
          formData.set("parent_id", parentId);
        }
        formData.set("content", content);
        const result = await createCommunityCommentFastAction(formData);
        setLocalComments((current) => current.map((comment) => (comment.id === draft.id ? result.comment : comment)));
      },
      () => {
        setLocalComments((current) => current.filter((comment) => comment.id !== draft.id));
        setCommentText(content);
        setActiveReplyTarget(activeReplyTarget);
      },
    );
  }

  function handleDeleteComment(commentId: string) {
    if (isPending || commentId.startsWith("draft-")) {
      return;
    }

    const previousComments = localComments;
    setLocalComments((current) => current.filter((comment) => comment.id !== commentId && comment.parent_id !== commentId));

    runAction(
      async () => {
        const formData = new FormData();
        formData.set("id", commentId);
        formData.set("slug", post.slug);
        await deleteCommunityCommentFastAction(formData);
      },
      () => setLocalComments(previousComments),
    );
  }

  return (
    <>
      <div className="community-detail-stats">
        <span>조회 {post.view_count.toLocaleString("ko-KR")}</span>
        <span>좋아요 {likeCount.toLocaleString("ko-KR")}</span>
        <span>댓글 {commentCountLabel}</span>
      </div>

      <div className="admin-actions community-post-actions">
        <Link href="/community" className="button ghost">
          목록
        </Link>

        {user ? (
          <button type="button" className={`button ${liked ? "primary" : "ghost"}`} onClick={handleLike} disabled={isPending}>
            {liked ? "좋아요 취소" : "좋아요"}
          </button>
        ) : (
          <Link href={`/login?next=%2Fcommunity%2F${encodeURIComponent(post.slug)}`} className="button ghost">
            로그인하고 좋아요
          </Link>
        )}

        {user?.isAdmin ? (
          <button type="button" className="button primary" onClick={handleFeatured} disabled={isPending}>
            {featured ? "추천 해제" : "추천!"}
          </button>
        ) : null}

        {isPending ? <span className="community-action-status">처리 중...</span> : null}
        {errorMessage ? <span className="community-action-error">{errorMessage}</span> : null}
      </div>

      <section className="article-view community-comments">
        <div className="section-head">
          <span className="eyebrow">COMMENTS</span>
          <h2>댓글</h2>
        </div>

        <div className="comment-list">
          {rootComments.map((comment) => {
            const canDeleteComment = Boolean(user && (user.id === comment.author_id || user.isAdmin));
            const isDraft = comment.id.startsWith("draft-");
            const replies = repliesByParent.get(comment.id) ?? [];

            return (
              <div key={comment.id} className="comment-thread">
                <div className={`comment-card ${isDraft ? "comment-card-pending" : ""}`}>
                  <div className="comment-card-head">
                    <div className="author-line">
                      {comment.author_avatar_url ? <img src={comment.author_avatar_url} alt="" /> : <span aria-hidden="true" />}
                      <strong>{comment.author_name}</strong>
                      <time>{isDraft ? "방금 전" : formatDate(comment.created_at)}</time>
                    </div>
                    <div className="comment-card-actions">
                      {user && canWriteComment ? (
                        <button
                          type="button"
                          className="text-link-button"
                          onClick={() => setActiveReplyTarget(comment)}
                          disabled={isPending || isDraft}
                        >
                          답글
                        </button>
                      ) : null}
                      {canDeleteComment ? (
                        <details className="delete-confirm comment-delete-confirm">
                          <summary className="text-danger-button">삭제</summary>
                          <div className="delete-confirm-box comment-delete-box">
                            <strong>정말 삭제할까요?</strong>
                            <p>삭제한 댓글과 답글은 되돌릴 수 없습니다.</p>
                            <button
                              type="button"
                              className="button danger"
                              onClick={() => handleDeleteComment(comment.id)}
                              disabled={isPending || isDraft}
                            >
                              최종 삭제
                            </button>
                          </div>
                        </details>
                      ) : null}
                    </div>
                  </div>
                  <p>{comment.content}</p>
                </div>

                {replies.length ? (
                  <div className="reply-list">
                    {replies.map((reply) => {
                      const canDeleteReply = Boolean(user && (user.id === reply.author_id || user.isAdmin));
                      const isReplyDraft = reply.id.startsWith("draft-");

                      return (
                        <div key={reply.id} className={`comment-card reply-card ${isReplyDraft ? "comment-card-pending" : ""}`}>
                          <div className="comment-card-head">
                            <div className="author-line">
                              {reply.author_avatar_url ? <img src={reply.author_avatar_url} alt="" /> : <span aria-hidden="true" />}
                              <strong>{reply.author_name}</strong>
                              <time>{isReplyDraft ? "방금 전" : formatDate(reply.created_at)}</time>
                            </div>
                            <div className="comment-card-actions">
                              {user && canWriteComment ? (
                                <button
                                  type="button"
                                  className="text-link-button"
                                  onClick={() => setActiveReplyTarget(comment)}
                                  disabled={isPending || isReplyDraft}
                                >
                                  답글
                                </button>
                              ) : null}
                              {canDeleteReply ? (
                                <details className="delete-confirm comment-delete-confirm">
                                  <summary className="text-danger-button">삭제</summary>
                                  <div className="delete-confirm-box comment-delete-box">
                                    <strong>정말 삭제할까요?</strong>
                                    <p>삭제한 답글은 되돌릴 수 없습니다.</p>
                                    <button
                                      type="button"
                                      className="button danger"
                                      onClick={() => handleDeleteComment(reply.id)}
                                      disabled={isPending || isReplyDraft}
                                    >
                                      최종 삭제
                                    </button>
                                  </div>
                                </details>
                              ) : null}
                            </div>
                          </div>
                          <p>{reply.content}</p>
                        </div>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>

        {user ? (
          canWriteComment ? (
            <form onSubmit={handleCommentSubmit} className="comment-form">
              {activeReplyTarget ? (
                <div className="reply-target">
                  <span>
                    <strong>{activeReplyTarget.author_name}</strong>님에게 답글 작성 중
                  </span>
                  <button type="button" className="text-link-button" onClick={() => setActiveReplyTarget(null)}>
                    취소
                  </button>
                </div>
              ) : null}
              <textarea
                name="content"
                className="admin-textarea"
                minLength={1}
                maxLength={800}
                placeholder="댓글을 남겨보세요"
                value={commentText}
                onChange={(event) => setCommentText(event.target.value)}
                required
              />
              <button type="submit" className="button primary" disabled={isPending || !commentText.trim()}>
                댓글 쓰기
              </button>
            </form>
          ) : (
            <p className="community-write-note">댓글은 디스코드 역할과 마인크래프트 계정 연동이 완료되어야 작성할 수 있습니다.</p>
          )
        ) : (
          <Link href={`/login?next=%2Fcommunity%2F${encodeURIComponent(post.slug)}`} className="button primary">
            로그인하고 댓글 쓰기
          </Link>
        )}
      </section>
    </>
  );
}
