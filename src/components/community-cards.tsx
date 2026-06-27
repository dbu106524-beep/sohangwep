import Link from "next/link";
import type { CommunityCategory, CommunityPost, CurrentUser } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export const communityCategoryLabels: Record<CommunityCategory, string> = {
  screenshot: "스크린샷",
  free: "자유게시판",
  tips: "팁과 노하우",
};

export const communityCategoryDescriptions: Record<CommunityCategory, string> = {
  screenshot: "서버에서 찍은 멋진 순간을 이미지 중심으로 공유하는 공간입니다.",
  free: "탐험대원들이 편하게 이야기를 나누는 자유 공간입니다.",
  tips: "플레이 공략, 생활 팁, 노하우를 정리해 공유합니다.",
};

export const communityCategories: Array<{ value: CommunityCategory | "all"; label: string }> = [
  { value: "all", label: "전체" },
  { value: "screenshot", label: "스크린샷" },
  { value: "free", label: "자유게시판" },
  { value: "tips", label: "팁과 노하우" },
];

export function CommunityTabs({ active }: { active: CommunityCategory | "all" }) {
  return (
    <div className="chip-row community-tabs" aria-label="커뮤니티 게시판">
      {communityCategories.map((category) => (
        <Link
          key={category.value}
          href={category.value === "all" ? "/community" : `/community?category=${category.value}`}
          className={`chip ${active === category.value ? "active" : ""}`}
        >
          {category.label}
        </Link>
      ))}
    </div>
  );
}

function PostStats({ post }: { post: CommunityPost }) {
  return (
    <div className="post-stats">
      <span>조회 {post.view_count.toLocaleString("ko-KR")}</span>
      <span>좋아요 {(post.like_count ?? 0).toLocaleString("ko-KR")}</span>
      <span>댓글 {(post.comment_count ?? 0).toLocaleString("ko-KR")}</span>
    </div>
  );
}

function FeaturedBadge({ post }: { post: CommunityPost }) {
  return post.featured ? (
    <span className="featured-badge" aria-label="관리자 추천">
      🥇 관리자 추천
    </span>
  ) : null;
}

export function ScreenshotCard({ post }: { post: CommunityPost }) {
  return (
    <Link href={`/community/${encodeURIComponent(post.slug)}`} className={`screenshot-card ${post.featured ? "featured" : ""}`}>
      <div className="screenshot-image">
        {post.image_url ? <img src={post.image_url} alt={post.title} /> : <span>SCREENSHOT</span>}
      </div>
      <div className="screenshot-body">
        <div className="post-topline">
          <span className="badge">스크린샷</span>
          <FeaturedBadge post={post} />
          <time>{formatDate(post.created_at)}</time>
        </div>
        <h3>{post.title}</h3>
        <AuthorLine post={post} />
        <PostStats post={post} />
      </div>
    </Link>
  );
}

export function CommunityListCard({ post }: { post: CommunityPost }) {
  return (
    <Link href={`/community/${encodeURIComponent(post.slug)}`} className={`post-card community-list-card ${post.featured ? "featured" : ""}`}>
      <div className="post-topline">
        <span className="badge">{communityCategoryLabels[post.category]}</span>
        <FeaturedBadge post={post} />
        <time>{formatDate(post.created_at)}</time>
      </div>
      <h3>{post.title}</h3>
      <p>{post.content}</p>
      <div className="community-card-footer">
        <AuthorLine post={post} />
        <PostStats post={post} />
      </div>
    </Link>
  );
}

export function AuthorLine({ post }: { post: CommunityPost }) {
  return (
    <div className="author-line">
      {post.author?.avatar_url ? <img src={post.author.avatar_url} alt="" /> : <span aria-hidden="true" />}
      <strong>{post.author?.display_name ?? post.author_name ?? "탐험대원"}</strong>
    </div>
  );
}

export function canManageCommunityPost(post: CommunityPost, user: CurrentUser | null) {
  return Boolean(user && user.id === post.author_id);
}
