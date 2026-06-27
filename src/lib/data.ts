import { guides, purchases } from "@/lib/mock-data";
import { fallbackNotices, fallbackProducts, sortNotices } from "@/lib/site-content";
import { createSupabaseServerClient, createSupabaseServiceClient, hasSupabaseEnv } from "@/lib/supabase/server";
import type { CommunityCategory, CommunityComment, CommunityPost, Guide, Notice, Product, Purchase } from "@/lib/types";

function logSupabaseFallback(scope: string, error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  console.warn(`[Supabase fallback] ${scope}: ${message}`);
}

export async function getNotices(options: { includeDrafts?: boolean } = {}): Promise<Notice[]> {
  if (!hasSupabaseEnv()) {
    return options.includeDrafts ? fallbackNotices : fallbackNotices.filter((notice) => notice.published);
  }

  const supabase = options.includeDrafts ? await createSupabaseServiceClient() : await createSupabaseServerClient();
  let query = supabase.from("notices").select("*").order("created_at", { ascending: false });

  if (!options.includeDrafts) {
    query = query.eq("published", true);
  }

  const { data, error } = await query;

  if (error) {
    logSupabaseFallback("getNotices", error.message);
    return fallbackNotices;
  }

  return (data ?? []).sort(sortNotices);
}

export async function getNotice(slug: string): Promise<Notice | null> {
  if (!hasSupabaseEnv()) {
    return fallbackNotices.find((notice) => notice.slug === slug) ?? null;
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("notices").select("*").eq("slug", slug).maybeSingle();

  if (error) {
    logSupabaseFallback("getNotice", error.message);
    return fallbackNotices.find((notice) => notice.slug === slug) ?? null;
  }

  return data;
}

export async function getGuides(): Promise<Guide[]> {
  if (!hasSupabaseEnv()) {
    return guides;
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("guides").select("*");

  if (error) {
    logSupabaseFallback("getGuides", error.message);
    return guides;
  }

  return data ?? [];
}

export async function getProducts(options: { includeInactive?: boolean } = {}): Promise<Product[]> {
  if (!hasSupabaseEnv()) {
    return options.includeInactive ? fallbackProducts : fallbackProducts.filter((product) => product.active);
  }

  const supabase = options.includeInactive ? await createSupabaseServiceClient() : await createSupabaseServerClient();
  let query = supabase.from("products").select("*").order("created_at", { ascending: false });

  if (!options.includeInactive) {
    query = query.eq("active", true);
  }

  const { data, error } = await query;

  if (error) {
    logSupabaseFallback("getProducts", error.message);
    return fallbackProducts;
  }

  return data ?? [];
}

export async function getProduct(slug: string): Promise<Product | null> {
  if (!hasSupabaseEnv()) {
    return fallbackProducts.find((product) => product.slug === slug) ?? null;
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("products").select("*").eq("slug", slug).maybeSingle();

  if (error) {
    logSupabaseFallback("getProduct", error.message);
    return fallbackProducts.find((product) => product.slug === slug) ?? null;
  }

  return data;
}

export async function getPurchases(userId?: string): Promise<Purchase[]> {
  if (!hasSupabaseEnv() || !userId) {
    return purchases;
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("purchases")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    logSupabaseFallback("getPurchases", error.message);
    return [];
  }

  return data ?? [];
}

function mapCommunityPost(row: unknown): CommunityPost {
  const post = row as CommunityPost;

  return {
    ...post,
    author: post.author ?? {
      display_name: post.author_name,
      avatar_url: post.author_avatar_url,
      role: "user",
    },
    comment_count: post.comment_count ?? 0,
    like_count: post.like_count ?? 0,
    liked_by_current_user: post.liked_by_current_user ?? false,
  };
}

function communitySlugCandidates(slug: string) {
  const candidates = new Set([slug]);
  try {
    candidates.add(decodeURIComponent(slug));
  } catch {
    // Keep the original slug if the browser already provided a decoded value.
  }
  return Array.from(candidates).filter(Boolean);
}

async function decorateCommunityPosts(posts: CommunityPost[], currentUserId?: string | null) {
  if (!hasSupabaseEnv() || posts.length === 0) {
    return posts;
  }

  const supabase = await createSupabaseServerClient();
  const ids = posts.map((post) => post.id);
  const [{ data: comments }, { data: likes }, likedResult] = await Promise.all([
    supabase.from("community_comments").select("post_id").in("post_id", ids),
    supabase.from("community_likes").select("post_id").in("post_id", ids),
    currentUserId
      ? supabase.from("community_likes").select("post_id").eq("user_id", currentUserId).in("post_id", ids)
      : Promise.resolve({ data: [] as Array<{ post_id: string }> }),
  ]);

  const commentCounts = new Map<string, number>();
  const likeCounts = new Map<string, number>();
  const likedPostIds = new Set((likedResult.data ?? []).map((like) => like.post_id));

  for (const comment of comments ?? []) {
    commentCounts.set(comment.post_id, (commentCounts.get(comment.post_id) ?? 0) + 1);
  }

  for (const like of likes ?? []) {
    likeCounts.set(like.post_id, (likeCounts.get(like.post_id) ?? 0) + 1);
  }

  return posts.map((post) => ({
    ...post,
    comment_count: commentCounts.get(post.id) ?? 0,
    like_count: likeCounts.get(post.id) ?? 0,
    liked_by_current_user: likedPostIds.has(post.id),
  }));
}

export async function getCommunityPosts(category?: CommunityCategory): Promise<CommunityPost[]> {
  if (!hasSupabaseEnv()) {
    return [];
  }

  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("community_posts")
    .select("*")
    .order("featured", { ascending: false })
    .order("featured_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (category) {
    query = query.eq("category", category);
  }

  const { data, error } = await query;

  if (error) {
    logSupabaseFallback("getCommunityPosts", error.message);
    return [];
  }

  return decorateCommunityPosts((data ?? []).map(mapCommunityPost));
}

export async function getCommunityPost(slug: string, options: { incrementView?: boolean; currentUserId?: string | null } = {}): Promise<CommunityPost | null> {
  if (!hasSupabaseEnv()) {
    return null;
  }

  const supabase = options.incrementView ? await createSupabaseServiceClient() : await createSupabaseServerClient();
  const slugs = communitySlugCandidates(slug);
  const { data, error } = await supabase
    .from("community_posts")
    .select("*")
    .in("slug", slugs)
    .limit(1)
    .maybeSingle();

  if (error) {
    logSupabaseFallback("getCommunityPost", error.message);
    return null;
  }

  if (!data) {
    return null;
  }

  if (options.incrementView && options.currentUserId) {
    const { error: viewError } = await supabase
      .from("community_post_views")
      .insert({ post_id: data.id, user_id: options.currentUserId });

    if (!viewError) {
      await supabase
        .from("community_posts")
        .update({ view_count: (data.view_count ?? 0) + 1 })
        .eq("id", data.id);
      data.view_count = (data.view_count ?? 0) + 1;
    } else if (viewError.code !== "23505") {
      logSupabaseFallback("incrementCommunityPostView", viewError.message);
    }
  }

  const [post] = await decorateCommunityPosts([mapCommunityPost(data)], options.currentUserId);
  return post;
}

export async function getCommunityComments(postId: string): Promise<CommunityComment[]> {
  if (!hasSupabaseEnv()) {
    return [];
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("community_comments")
    .select("*")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });

  if (error) {
    logSupabaseFallback("getCommunityComments", error.message);
    return [];
  }

  return data ?? [];
}
