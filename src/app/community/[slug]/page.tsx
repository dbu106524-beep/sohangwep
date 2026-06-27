import Link from "next/link";
import { notFound } from "next/navigation";
import {
  createCommunityCommentAction,
  deleteCommunityCommentAction,
  deleteCommunityPostAction,
  toggleCommunityFeaturedAction,
  toggleCommunityLikeAction,
} from "@/app/community/actions";
import { AuthorLine, canManageCommunityPost, communityCategoryLabels } from "@/components/community-cards";
import { getCurrentUser } from "@/lib/auth";
import { getCommunityComments, getCommunityPost } from "@/lib/data";
import { formatDate } from "@/lib/utils";

export default async function CommunityPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const user = await getCurrentUser();
  const post = await getCommunityPost(slug, { incrementView: true, currentUserId: user?.id });

  if (!post) {
    notFound();
  }

  const comments = await getCommunityComments(post.id);
  const canManage = canManageCommunityPost(post, user);
  const canWriteComment = Boolean(user?.profile?.minecraft_name && user.profile.community_role_verified);

  return (
    <main>
      <article className="article-view community-article">
        <div className="post-topline">
          <span className="badge">{communityCategoryLabels[post.category]}</span>
          {post.featured ? (
            <span className="featured-badge" aria-label="관리자 추천">
              🥇 관리자 추천
            </span>
          ) : null}
          <time>{formatDate(post.created_at)}</time>
        </div>

        <h1>{post.title}</h1>
        <AuthorLine post={post} />

        <div className="community-detail-stats">
          <span>조회 {post.view_count.toLocaleString("ko-KR")}</span>
          <span>좋아요 {(post.like_count ?? 0).toLocaleString("ko-KR")}</span>
          <span>댓글 {comments.length.toLocaleString("ko-KR")}</span>
        </div>

        {post.image_url ? (
          <div className="community-article-image">
            <img src={post.image_url} alt={post.title} />
          </div>
        ) : null}

        <div className="article-body">
          {post.content.split("\n").map((line, index) => (
            <p key={`${line}-${index}`}>{line}</p>
          ))}
        </div>

        <div className="admin-actions community-post-actions">
          <Link href="/community" className="button ghost">
            목록
          </Link>

          {user ? (
            <form action={toggleCommunityLikeAction}>
              <input type="hidden" name="post_id" value={post.id} />
              <input type="hidden" name="slug" value={post.slug} />
              <button type="submit" className={`button ${post.liked_by_current_user ? "primary" : "ghost"}`}>
                {post.liked_by_current_user ? "좋아요 취소" : "좋아요"}
              </button>
            </form>
          ) : (
            <Link href={`/login?next=%2Fcommunity%2F${post.slug}`} className="button ghost">
              로그인하고 좋아요
            </Link>
          )}

          {user?.isAdmin ? (
            <form action={toggleCommunityFeaturedAction}>
              <input type="hidden" name="id" value={post.id} />
              <input type="hidden" name="slug" value={post.slug} />
              <input type="hidden" name="featured" value={String(post.featured)} />
              <button type="submit" className="button primary">
                {post.featured ? "추천 해제" : "추천!"}
              </button>
            </form>
          ) : null}

          {canManage ? (
            <>
              <Link href={`/community/${post.slug}/edit`} className="button primary">
                수정
              </Link>
              <details className="delete-confirm">
                <summary className="button danger">삭제</summary>
                <div className="delete-confirm-box">
                  <strong>정말 삭제할까요?</strong>
                  <p>삭제한 게시글과 댓글은 되돌릴 수 없습니다.</p>
                  <form action={deleteCommunityPostAction}>
                    <input type="hidden" name="id" value={post.id} />
                    <input type="hidden" name="slug" value={post.slug} />
                    <button type="submit" className="button danger">
                      최종 삭제
                    </button>
                  </form>
                </div>
              </details>
            </>
          ) : null}
        </div>
      </article>

      <section className="article-view community-comments">
        <div className="section-head">
          <span className="eyebrow">COMMENTS</span>
          <h2>댓글</h2>
        </div>

        <div className="comment-list">
          {comments.map((comment) => {
            const canDeleteComment = Boolean(user && (user.id === comment.author_id || user.isAdmin));

            return (
              <div key={comment.id} className="comment-card">
                <div className="comment-card-head">
                  <div className="author-line">
                    {comment.author_avatar_url ? <img src={comment.author_avatar_url} alt="" /> : <span aria-hidden="true" />}
                    <strong>{comment.author_name}</strong>
                    <time>{formatDate(comment.created_at)}</time>
                  </div>
                  {canDeleteComment ? (
                    <form action={deleteCommunityCommentAction}>
                      <input type="hidden" name="id" value={comment.id} />
                      <input type="hidden" name="slug" value={post.slug} />
                      <button type="submit" className="text-danger-button">
                        삭제
                      </button>
                    </form>
                  ) : null}
                </div>
                <p>{comment.content}</p>
              </div>
            );
          })}
        </div>

        {user ? (
          canWriteComment ? (
            <form action={createCommunityCommentAction} className="comment-form">
              <input type="hidden" name="post_id" value={post.id} />
              <input type="hidden" name="slug" value={post.slug} />
              <textarea name="content" className="admin-textarea" minLength={1} maxLength={800} placeholder="댓글을 남겨보세요." required />
              <button type="submit" className="button primary">
                댓글 달기
              </button>
            </form>
          ) : (
            <p className="community-write-note">댓글은 디스코드 역할과 마인크래프트 계정 연동이 완료되어야 작성할 수 있습니다.</p>
          )
        ) : (
          <Link href={`/login?next=%2Fcommunity%2F${post.slug}`} className="button primary">
            로그인하고 댓글 달기
          </Link>
        )}
      </section>
    </main>
  );
}
