"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser, requireCurrentUser } from "@/lib/auth";
import { getCommunityPost } from "@/lib/data";
import { createSupabaseServerClient, createSupabaseServiceClient, hasSupabaseEnv } from "@/lib/supabase/server";
import type { CommunityCategory, CurrentUser } from "@/lib/types";
import { slugify } from "@/lib/utils";

const communityCategories = new Set<CommunityCategory>(["screenshot", "free", "tips"]);
const allowedImageTypes = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);

function getCategory(value: FormDataEntryValue | null): CommunityCategory {
  const category = String(value ?? "free") as CommunityCategory;
  return communityCategories.has(category) ? category : "free";
}

function getRequiredText(formData: FormData, key: string, label: string) {
  const value = String(formData.get(key) ?? "").trim();
  if (!value) {
    throw new Error(`${label}을 입력해 주세요.`);
  }
  return value;
}

function getSubmissionId(formData: FormData) {
  return String(formData.get("submission_id") ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "")
    .slice(0, 48);
}

function minecraftHeadUrl(minecraftUuid: string | null | undefined) {
  return minecraftUuid ? `https://mc-heads.net/avatar/${minecraftUuid}/64` : null;
}

function communityAuthorName(user: CurrentUser) {
  return user.profile?.minecraft_name || user.name;
}

function communityAuthorAvatar(user: CurrentUser) {
  return minecraftHeadUrl(user.profile?.minecraft_uuid) || user.avatarUrl;
}

function assertCommunityWriter(user: CurrentUser) {
  if (!user.profile?.minecraft_name || !user.profile?.community_role_verified) {
    throw new Error("커뮤니티 글쓰기는 디스코드 역할과 마인크래프트 계정 연동이 필요합니다.");
  }
}

function parseImageList(value: FormDataEntryValue | null, fallback: string[] = []) {
  if (typeof value !== "string" || !value.trim()) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string" && Boolean(item.trim())).slice(0, 5) : fallback;
  } catch {
    return fallback;
  }
}

function getImageFiles(formData: FormData) {
  return [...formData.getAll("image_files"), ...formData.getAll("image_file")]
    .filter((file): file is File => file instanceof File && file.size > 0)
    .slice(0, 5);
}

async function uploadCommunityImage(file: File) {
  if (!allowedImageTypes.has(file.type)) {
    throw new Error("이미지는 PNG, JPG, WEBP, GIF 파일만 업로드할 수 있습니다.");
  }

  if (file.size > 6 * 1024 * 1024) {
    throw new Error("이미지는 6MB 이하만 업로드할 수 있습니다.");
  }

  const supabase = await createSupabaseServerClient();
  const bucket = "community-images";
  await supabase.storage.createBucket(bucket, { public: true }).catch(() => null);

  const extension = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "png";
  const path = `posts/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    contentType: file.type,
    upsert: false,
  });

  if (error) {
    throw new Error(`커뮤니티 이미지 업로드에 실패했습니다: ${error.message}`);
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

async function resolveCommunityImageUrls(formData: FormData, fallback: string[] = []) {
  const files = getImageFiles(formData);

  if (files.length === 0) {
    return fallback.slice(0, 5);
  }

  const uploaded = [];
  for (const file of files) {
    uploaded.push(await uploadCommunityImage(file));
  }
  return uploaded;
}

function revalidateCommunity(slug?: string) {
  revalidatePath("/community");
  revalidatePath("/profile");
  if (slug) {
    revalidatePath(`/community/${slug}`);
  }
}

export async function createCommunityPostAction(formData: FormData) {
  const user = await requireCurrentUser("/community/new");

  if (!hasSupabaseEnv()) {
    revalidateCommunity();
    redirect("/community");
  }

  assertCommunityWriter(user);
  const title = getRequiredText(formData, "title", "제목");
  const category = getCategory(formData.get("category"));
  const content = getRequiredText(formData, "content", "내용");
  const submissionId = getSubmissionId(formData) || crypto.randomUUID().slice(0, 12);
  const slugBase = slugify(title) || "post";
  const slug = `${slugBase}-${submissionId}`;
  const imageUrls = await resolveCommunityImageUrls(formData);
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("community_posts").insert({
    author_id: user.id,
    author_name: communityAuthorName(user),
    author_avatar_url: communityAuthorAvatar(user),
    title,
    slug,
    content,
    category,
    image_url: imageUrls[0] ?? null,
    image_urls: imageUrls,
  });

  if (error) {
    if (error.code === "23505") {
      revalidateCommunity(slug);
      redirect(`/community/${encodeURIComponent(slug)}`);
    }
    throw new Error(`커뮤니티 글 등록에 실패했습니다: ${error.message}`);
  }

  revalidateCommunity(slug);
  redirect(`/community/${encodeURIComponent(slug)}`);
}

export async function updateCommunityPostAction(formData: FormData) {
  const user = await requireCurrentUser("/community");

  if (!hasSupabaseEnv()) {
    redirect("/community");
  }

  const id = String(formData.get("id") ?? "");
  const currentSlug = String(formData.get("slug") ?? "");
  const currentImages = parseImageList(
    formData.get("current_image_urls"),
    [String(formData.get("current_image_url") ?? "").trim()].filter(Boolean),
  );
  const post = await getCommunityPost(currentSlug);

  if (!post || (post.author_id !== user.id && !user.isAdmin)) {
    throw new Error("수정 권한이 없습니다.");
  }

  const title = getRequiredText(formData, "title", "제목");
  const category = getCategory(formData.get("category"));
  const content = getRequiredText(formData, "content", "내용");
  const imageUrls = await resolveCommunityImageUrls(formData, currentImages);
  const supabase = user.isAdmin ? await createSupabaseServiceClient() : await createSupabaseServerClient();
  const { error } = await supabase
    .from("community_posts")
    .update({
      title,
      content,
      category,
      image_url: imageUrls[0] ?? null,
      image_urls: imageUrls,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    throw new Error(`커뮤니티 글 수정에 실패했습니다: ${error.message}`);
  }

  revalidateCommunity(currentSlug);
  redirect(`/community/${encodeURIComponent(currentSlug)}/edit?saved=1`);
}

export async function deleteCommunityPostAction(formData: FormData) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?next=%2Fcommunity");
  }

  const id = String(formData.get("id") ?? "");
  const slug = String(formData.get("slug") ?? "");
  const post = await getCommunityPost(slug);

  if (!post || (post.author_id !== user.id && !user.isAdmin)) {
    throw new Error("삭제 권한이 없습니다.");
  }

  if (hasSupabaseEnv()) {
    const supabase = user.isAdmin ? await createSupabaseServiceClient() : await createSupabaseServerClient();
    const { error } = await supabase.from("community_posts").delete().eq("id", id);
    if (error) {
      throw new Error(`커뮤니티 글 삭제에 실패했습니다: ${error.message}`);
    }
  }

  revalidateCommunity(slug);
  redirect("/community");
}

async function toggleCommunityLikeForUser(postId: string, userId: string) {
  const supabase = await createSupabaseServerClient();
  const { data: existing } = await supabase
    .from("community_likes")
    .select("post_id")
    .eq("post_id", postId)
    .eq("user_id", userId)
    .maybeSingle();

  const liked = !existing;
  const { error } = existing
    ? await supabase.from("community_likes").delete().eq("post_id", postId).eq("user_id", userId)
    : await supabase.from("community_likes").insert({ post_id: postId, user_id: userId });

  if (error) {
    throw new Error(`좋아요 처리에 실패했습니다: ${error.message}`);
  }

  const { count } = await supabase
    .from("community_likes")
    .select("post_id", { count: "exact", head: true })
    .eq("post_id", postId);

  return { liked, likeCount: count ?? 0 };
}

async function setCommunityFeatured(id: string, featured: boolean) {
  const featuredAt = featured ? new Date().toISOString() : null;
  const supabase = await createSupabaseServiceClient();
  const { error } = await supabase
    .from("community_posts")
    .update({
      featured,
      featured_at: featuredAt,
    })
    .eq("id", id);

  if (error) {
    throw new Error(`추천 글 변경에 실패했습니다: ${error.message}`);
  }

  return { featured, featuredAt };
}

export async function createCommunityCommentFastAction(formData: FormData) {
  const slug = String(formData.get("slug") ?? "");
  const postId = String(formData.get("post_id") ?? "");
  const parentId = String(formData.get("parent_id") ?? "").trim() || null;
  const user = await requireCurrentUser(slug ? `/community/${slug}` : "/community");

  assertCommunityWriter(user);
  const content = getRequiredText(formData, "content", "댓글");
  const supabase = await createSupabaseServiceClient();

  if (parentId) {
    const { data: parentComment, error: parentError } = await supabase
      .from("community_comments")
      .select("id,post_id,parent_id")
      .eq("id", parentId)
      .maybeSingle();

    if (parentError) {
      throw new Error(`답글 대상 확인에 실패했습니다: ${parentError.message}`);
    }

    if (!parentComment || parentComment.post_id !== postId || parentComment.parent_id) {
      throw new Error("답글을 달 댓글을 찾을 수 없습니다.");
    }
  }

  const { data, error } = await supabase
    .from("community_comments")
    .insert({
      post_id: postId,
      parent_id: parentId,
      author_id: user.id,
      author_name: communityAuthorName(user),
      author_avatar_url: communityAuthorAvatar(user),
      content,
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(`댓글 등록에 실패했습니다: ${error.message}`);
  }

  revalidateCommunity(slug);
  return { comment: data };
}

export async function deleteCommunityCommentFastAction(formData: FormData) {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("로그인이 필요합니다.");
  }

  const id = String(formData.get("id") ?? "");
  const slug = String(formData.get("slug") ?? "");

  if (!id) {
    throw new Error("삭제할 댓글을 찾을 수 없습니다.");
  }

  const supabase = await createSupabaseServiceClient();
  const { data: comment, error: readError } = await supabase
    .from("community_comments")
    .select("id,author_id")
    .eq("id", id)
    .maybeSingle();

  if (readError) {
    throw new Error(`댓글 확인에 실패했습니다: ${readError.message}`);
  }

  if (!comment || (comment.author_id !== user.id && !user.isAdmin)) {
    throw new Error("댓글 삭제 권한이 없습니다.");
  }

  const { error } = await supabase.from("community_comments").delete().eq("id", id);
  if (error) {
    throw new Error(`댓글 삭제에 실패했습니다: ${error.message}`);
  }

  revalidateCommunity(slug);
  return { deletedId: id };
}

export async function toggleCommunityLikeFastAction(formData: FormData) {
  const slug = String(formData.get("slug") ?? "");
  const postId = String(formData.get("post_id") ?? "");
  const user = await requireCurrentUser(slug ? `/community/${slug}` : "/community");
  const result = await toggleCommunityLikeForUser(postId, user.id);

  revalidateCommunity(slug);
  return result;
}

export async function toggleCommunityFeaturedFastAction(formData: FormData) {
  const user = await getCurrentUser();

  if (!user?.isAdmin) {
    throw new Error("관리자만 추천 글을 변경할 수 있습니다.");
  }

  const id = String(formData.get("id") ?? "");
  const slug = String(formData.get("slug") ?? "");
  const featured = String(formData.get("featured") ?? "") === "true";
  const result = await setCommunityFeatured(id, !featured);

  revalidateCommunity(slug);
  return result;
}
