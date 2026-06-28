import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteCommunityPostAction } from "@/app/community/actions";
import { AuthorLine, canManageCommunityPost, communityCategoryLabels } from "@/components/community-cards";
import { CommunityPostInteractions } from "@/components/community-post-interactions";
import { getCurrentUser } from "@/lib/auth";
import { getCommunityComments, getCommunityPost } from "@/lib/data";
import { formatDate, getImageUrls } from "@/lib/utils";

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
  const imageUrls = getImageUrls(post);

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

        {imageUrls.length ? (
          <div className="article-image-gallery community-image-gallery">
            {imageUrls.map((url) => (
              <img key={url} src={url} alt={post.title} />
            ))}
          </div>
        ) : null}

        <div className="article-body">
          {post.content.split("\n").map((line, index) => (
            <p key={`${line}-${index}`}>{line}</p>
          ))}
        </div>

        <CommunityPostInteractions post={post} comments={comments} user={user} canWriteComment={canWriteComment} />

        {canManage ? (
          <div className="admin-actions community-post-actions">
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
          </div>
        ) : null}
      </article>
    </main>
  );
}
