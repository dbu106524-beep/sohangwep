"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseServiceClient, hasSupabaseEnv } from "@/lib/supabase/server";
import { noticeTypeLabels } from "@/lib/site-content";
import type { LegalPageSlug, Notice, Purchase } from "@/lib/types";
import { getSiteUrl, slugify } from "@/lib/utils";

async function assertAdmin() {
  const { allowed } = await requireAdmin();
  if (!allowed) {
    throw new Error("관리자 권한이 필요합니다.");
  }
}

const allowedImageTypes = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);
const maxImageFileSize = 8 * 1024 * 1024;
const maxImageUploadTotalSize = 40 * 1024 * 1024;
const discordNewsSubject: Record<Notice["category"], string> = {
  notice: "공지사항이",
  update: "업데이트가",
  event: "이벤트가",
};

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
  const files = [...formData.getAll("image_files"), ...formData.getAll("image_file")].filter(
    (file): file is File => file instanceof File && file.size > 0,
  );
  return files.slice(0, 5);
}

async function uploadImageFile({ file, bucket, folder }: { file: File; bucket: string; folder: string }) {
  if (!allowedImageTypes.has(file.type)) {
    throw new Error("이미지는 PNG, JPG, WEBP, GIF 파일만 업로드할 수 있습니다.");
  }

  if (file.size > maxImageFileSize) {
    throw new Error("이미지는 파일 1개당 8MB 이하만 업로드할 수 있습니다.");
  }

  const supabase = await createSupabaseServiceClient();
  await supabase.storage.createBucket(bucket, { public: true }).catch(() => null);

  const extension = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "png";
  const path = `${folder}/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    contentType: file.type,
    upsert: false,
  });

  if (error) {
    throw new Error(`이미지 업로드에 실패했습니다: ${error.message}`);
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

async function resolveUploadedImageUrls({
  formData,
  bucket,
  folder,
  fallback = [],
}: {
  formData: FormData;
  bucket: string;
  folder: string;
  fallback?: string[];
}) {
  const directUrl = String(formData.get("image_url") ?? "").trim();
  const formImageUrls = parseImageList(formData.get("current_image_urls"), fallback);
  const files = getImageFiles(formData);

  if (files.length > 0) {
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);

    if (totalSize > maxImageUploadTotalSize) {
      throw new Error("이미지는 한 번에 최대 40MB까지만 업로드할 수 있습니다.");
    }

    const uploaded = [];
    for (const file of files) {
      uploaded.push(await uploadImageFile({ file, bucket, folder }));
    }
    return uploaded;
  }

  if (directUrl) {
    return [directUrl, ...formImageUrls.filter((url) => url !== directUrl)].slice(0, 5);
  }

  return formImageUrls.slice(0, 5);
}

async function resolveNoticeImageUrls(formData: FormData, fallback: string[] = []) {
  return resolveUploadedImageUrls({ formData, bucket: "notice-images", folder: "posts", fallback });
}

async function resolveProductImageUrls(formData: FormData, fallback: string[] = []) {
  return resolveUploadedImageUrls({ formData, bucket: "shop-images", folder: "products", fallback });
}

function getProductKind(formData: FormData) {
  return formData.get("product_kind") === "goods" ? "goods" : "credit";
}

function getDiscountPercent(formData: FormData) {
  const value = Number(formData.get("discount_percent") ?? 0);
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(100, Math.max(0, Math.round(value)));
}

function getSortOrder(formData: FormData) {
  const value = Number(formData.get("sort_order") ?? 0);
  return Number.isFinite(value) ? Math.round(value) : 0;
}

function getActionErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "요청을 처리하는 중 오류가 발생했습니다.";
}

function getLegalSlug(formData: FormData): LegalPageSlug {
  const slug = String(formData.get("slug") ?? "");
  if (slug === "privacy" || slug === "refund") {
    return slug;
  }

  return "service";
}

function getPurchaseStatus(formData: FormData): Purchase["status"] {
  const status = String(formData.get("status") ?? "pending");
  if (
    status === "paid" ||
    status === "fulfilled" ||
    status === "failed" ||
    status === "refunded" ||
    status === "shipped" ||
    status === "delivered"
  ) {
    return status;
  }

  return "pending";
}

async function sendNoticeDiscordNotification(
  notice: Pick<Notice, "id" | "title" | "slug" | "excerpt" | "image_url" | "category">,
) {
  const webhookUrl = process.env.DISCORD_NOTICE_WEBHOOK_URL;
  if (!webhookUrl) {
    return;
  }

  const noticeUrl = new URL(`/notices/${encodeURIComponent(notice.slug || notice.id)}`, getSiteUrl()).toString();
  const label = noticeTypeLabels[notice.category];
  const subject = discordNewsSubject[notice.category];

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "소행성",
        content: `📢 새 ${subject} 등록되었습니다!\n**${notice.title}**\n${noticeUrl}`,
        embeds: [
          {
            title: notice.title,
            description: notice.excerpt || `새로운 ${label}을 확인해 주세요.`,
            url: noticeUrl,
            color: 16765807,
            footer: { text: label },
            image: notice.image_url ? { url: notice.image_url } : undefined,
          },
        ],
      }),
    });

    if (!response.ok) {
      console.warn(`[Discord notice webhook] ${response.status} ${await response.text()}`);
    }
  } catch (error) {
    console.warn("[Discord notice webhook]", error);
  }
}

export async function createNoticeAction(formData: FormData) {
  await assertAdmin();

  if (!hasSupabaseEnv()) {
    revalidatePath("/admin/notices");
    return;
  }

  const title = String(formData.get("title") ?? "");
  const category = String(formData.get("category") ?? "notice") as Notice["category"];
  const published = formData.get("published") === "on";
  const imageUrls = await resolveNoticeImageUrls(formData);
  const slug = slugify(title) || crypto.randomUUID().slice(0, 8);
  const supabase = await createSupabaseServiceClient();
  const { data: notice, error } = await supabase
    .from("notices")
    .insert({
      title,
      slug,
      excerpt: String(formData.get("excerpt") ?? ""),
      content: String(formData.get("content") ?? ""),
      category,
      image_url: imageUrls[0] ?? null,
      image_urls: imageUrls,
      published,
    })
    .select("id,title,slug,excerpt,image_url,category")
    .single();

  if (error) {
    throw new Error(`이미지 업로드에 실패했습니다: ${error.message}`);
  }

  if (published && notice) {
    await sendNoticeDiscordNotification(notice);
  }

  revalidatePath("/notices");
  revalidatePath("/admin/notices");
}

export async function updateNoticeAction(formData: FormData) {
  await assertAdmin();

  if (!hasSupabaseEnv()) {
    revalidatePath("/admin/notices");
    return;
  }

  const id = String(formData.get("id") ?? "");
  const title = String(formData.get("title") ?? "");
  const currentSlug = String(formData.get("current_slug") ?? "").trim();
  const currentImages = parseImageList(
    formData.get("current_image_urls"),
    [String(formData.get("current_image_url") ?? "").trim()].filter(Boolean),
  );
  const imageUrls = await resolveNoticeImageUrls(formData, currentImages);
  const supabase = await createSupabaseServiceClient();
  const { error } = await supabase
    .from("notices")
    .update({
    title,
    slug: slugify(title) || currentSlug || id,
    excerpt: String(formData.get("excerpt") ?? ""),
    content: String(formData.get("content") ?? ""),
    category: String(formData.get("category") ?? "notice") as Notice["category"],
    image_url: imageUrls[0] ?? null,
    image_urls: imageUrls,
    published: formData.get("published") === "on",
    })
    .eq("id", id);

  if (error) {
    throw new Error(`이미지 업로드에 실패했습니다: ${error.message}`);
  }

  revalidatePath("/notices");
  revalidatePath("/admin/notices");
  revalidatePath(`/admin/notices/${id}`);
  redirect(`/admin/notices/${id}?saved=1`);
}

export async function deleteNoticeAction(formData: FormData) {
  await assertAdmin();

  if (!hasSupabaseEnv()) {
    revalidatePath("/admin/notices");
    return;
  }

  const id = String(formData.get("id") ?? "");
  const supabase = await createSupabaseServiceClient();
  await supabase.from("notices").delete().eq("id", id);
  revalidatePath("/notices");
  revalidatePath("/admin/notices");
}

export async function updateLegalPageAction(formData: FormData) {
  await assertAdmin();

  const slug = getLegalSlug(formData);

  if (!hasSupabaseEnv()) {
    revalidatePath("/admin/legal");
    revalidatePath(`/terms/${slug}`);
    return;
  }

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();

  if (!title || !description || !content) {
    throw new Error("제목, 설명, 본문을 모두 입력해 주세요.");
  }

  const supabase = await createSupabaseServiceClient();
  const { error } = await supabase.from("legal_pages").upsert({
    slug,
    title,
    description,
    content,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    throw new Error(`이미지 업로드에 실패했습니다: ${error.message}`);
  }

  revalidatePath("/admin/legal");
  revalidatePath(`/terms/${slug}`);
  redirect("/admin/legal?saved=1");
}

export async function updatePurchaseStatusAction(formData: FormData) {
  await assertAdmin();

  if (!hasSupabaseEnv()) {
    revalidatePath("/admin/purchases");
    return;
  }

  const id = String(formData.get("id") ?? "");
  const status = getPurchaseStatus(formData);
  const supabase = await createSupabaseServiceClient();
  const { error } = await supabase.from("purchases").update({ status }).eq("id", id);

  if (error) {
    throw new Error(`이미지 업로드에 실패했습니다: ${error.message}`);
  }

  revalidatePath("/admin/purchases");
  revalidatePath("/profile/purchases");
  revalidatePath("/profile");
}

export async function shipPurchaseAction(formData: FormData) {
  await assertAdmin();

  if (!hasSupabaseEnv()) {
    revalidatePath("/admin/purchases");
    return;
  }

  const id = String(formData.get("id") ?? "");
  const trackingCarrier = String(formData.get("tracking_carrier") ?? "").trim();
  const trackingNumber = String(formData.get("tracking_number") ?? "").trim();

  if (!trackingCarrier || !trackingNumber) {
    throw new Error("택배사와 송장번호를 입력해 주세요.");
  }

  const supabase = await createSupabaseServiceClient();
  const { error } = await supabase
    .from("purchases")
    .update({
      status: "shipped",
      tracking_carrier: trackingCarrier,
      tracking_number: trackingNumber,
      shipped_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("product_kind", "goods");

  if (error) {
    throw new Error(`이미지 업로드에 실패했습니다: ${error.message}`);
  }

  revalidatePath("/admin/purchases");
  revalidatePath("/profile/purchases");
  revalidatePath("/profile");
}

export async function createProductAction(formData: FormData) {
  await assertAdmin();

  if (!hasSupabaseEnv()) {
    revalidatePath("/admin/products");
    return;
  }

  let actionError: string | null = null;

  try {
    const name = String(formData.get("name") ?? "");
    const productKind = getProductKind(formData);
    const imageUrls = await resolveProductImageUrls(formData);
    const supabase = await createSupabaseServiceClient();
    const { error } = await supabase.from("products").insert({
      name,
      slug: slugify(name),
      description: String(formData.get("description") ?? ""),
      details: String(formData.get("details") ?? ""),
      product_kind: productKind,
      price_krw: Number(formData.get("price_krw") ?? 0),
      discount_percent: getDiscountPercent(formData),
      cash_amount: productKind === "credit" ? Number(formData.get("cash_amount") ?? 0) : 0,
      image_url: imageUrls[0] ?? null,
      image_urls: imageUrls,
      minecraft_item_key: productKind === "credit" ? String(formData.get("minecraft_item_key") ?? "") : null,
      sort_order: getSortOrder(formData),
      active: formData.get("active") === "on",
    });

    if (error) {
      throw new Error(`이미지 업로드에 실패했습니다: ${error.message}`);
    }
  } catch (error) {
    actionError = getActionErrorMessage(error);
  }

  if (actionError) {
    redirect(`/admin/products?error=${encodeURIComponent(actionError)}`);
  }

  revalidatePath("/shop");
  revalidatePath("/admin/products");
  redirect("/admin/products?saved=1");
}

export async function updateProductAction(formData: FormData) {
  await assertAdmin();

  if (!hasSupabaseEnv()) {
    revalidatePath("/admin/products");
    return;
  }

  let actionError: string | null = null;

  try {
    const id = String(formData.get("id") ?? "");
    const name = String(formData.get("name") ?? "");
    const productKind = getProductKind(formData);
    const currentImages = parseImageList(
      formData.get("current_image_urls"),
      [String(formData.get("current_image_url") ?? "").trim()].filter(Boolean),
    );
    const imageUrls = await resolveProductImageUrls(formData, currentImages);
    const supabase = await createSupabaseServiceClient();
    const { error } = await supabase
      .from("products")
      .update({
        name,
        slug: slugify(name),
        description: String(formData.get("description") ?? ""),
        details: String(formData.get("details") ?? ""),
        product_kind: productKind,
        price_krw: Number(formData.get("price_krw") ?? 0),
        discount_percent: getDiscountPercent(formData),
        cash_amount: productKind === "credit" ? Number(formData.get("cash_amount") ?? 0) : 0,
        image_url: imageUrls[0] ?? null,
        image_urls: imageUrls,
        minecraft_item_key: productKind === "credit" ? String(formData.get("minecraft_item_key") ?? "") : null,
        sort_order: getSortOrder(formData),
        active: formData.get("active") === "on",
      })
      .eq("id", id);

    if (error) {
      throw new Error(`이미지 업로드에 실패했습니다: ${error.message}`);
    }
  } catch (error) {
    actionError = getActionErrorMessage(error);
  }

  if (actionError) {
    redirect(`/admin/products?error=${encodeURIComponent(actionError)}`);
  }

  revalidatePath("/shop");
  revalidatePath("/admin/products");
  redirect("/admin/products?saved=1");
}

export async function deleteProductAction(formData: FormData) {
  await assertAdmin();

  if (!hasSupabaseEnv()) {
    revalidatePath("/admin/products");
    return;
  }

  let actionError: string | null = null;

  try {
    const id = String(formData.get("id") ?? "");
    const supabase = await createSupabaseServiceClient();
    const { error } = await supabase.from("products").delete().eq("id", id);

    if (error) {
      throw new Error(`이미지 업로드에 실패했습니다: ${error.message}`);
    }
  } catch (error) {
    actionError = getActionErrorMessage(error);
  }

  if (actionError) {
    redirect(`/admin/products?error=${encodeURIComponent(actionError)}`);
  }

  revalidatePath("/shop");
  revalidatePath("/admin/products");
  redirect("/admin/products?saved=1");
}
