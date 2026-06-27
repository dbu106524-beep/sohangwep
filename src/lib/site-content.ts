import seed from "@/lib/static-content.json";
import type { Notice, Product } from "@/lib/types";

type SeedPost = {
  id: string;
  type: "notice" | "update" | "event";
  title: string;
  summary: string;
  content: string;
  status: "published" | "draft";
  pinned?: boolean;
  tags?: string[];
  createdAt: string;
  updatedAt?: string;
};

export type GuideCategory = {
  id: string;
  title: string;
  description: string;
  order: number;
  status: "published" | "draft";
};

export type GuideDoc = {
  id: string;
  categoryId: string;
  title: string;
  summary: string;
  badge?: string;
  location?: string;
  keyHint?: string;
  content: string;
  status: "published" | "draft";
  order: number;
  createdAt: string;
  updatedAt?: string;
};

export const siteSettings = seed.settings;

export const siteNavItems = [
  { href: "/notices", label: "공지사항" },
  { href: "/updates", label: "업데이트" },
  { href: "/community", label: "커뮤니티" },
  { href: "/shop", label: "상점" },
];

export const noticeTypeLabels: Record<Notice["category"], string> = {
  notice: "공지사항",
  update: "업데이트",
  event: "이벤트",
};

export const noticeTypePaths: Record<Notice["category"], string> = {
  notice: "/notices",
  update: "/updates",
  event: "/events",
};

export function getDiscordInviteUrl() {
  return siteSettings.discordInviteUrl || "https://discord.gg/ju5YCandvB";
}

export function sortNotices(a: Notice, b: Notice) {
  return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
}

export function toFallbackNotice(post: SeedPost): Notice {
  return {
    id: post.id,
    title: post.title,
    slug: post.id,
    excerpt: post.summary,
    content: post.content,
    category: post.type,
    image_url: null,
    published: post.status === "published",
    created_at: post.updatedAt || post.createdAt,
  };
}

export const fallbackNotices: Notice[] = (seed.posts as SeedPost[])
  .filter((post) => post.status === "published")
  .map(toFallbackNotice)
  .sort(sortNotices);

export const fallbackProducts: Product[] = [];

export const guideCategories = (seed.guideCategories as GuideCategory[])
  .filter((category) => category.status === "published")
  .sort((a, b) => a.order - b.order);

export const guideDocs = (seed.guides as GuideDoc[])
  .filter((guide) => guide.status === "published")
  .sort((a, b) => a.order - b.order);
