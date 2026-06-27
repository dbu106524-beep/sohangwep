"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseServiceClient, hasSupabaseEnv } from "@/lib/supabase/server";
import type { Notice } from "@/lib/types";
import { slugify } from "@/lib/utils";

async function assertAdmin() {
  const { allowed } = await requireAdmin();
  if (!allowed) {
    throw new Error("관리자 권한이 필요합니다.");
  }
}

const allowedImageTypes = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);

async function resolveUploadedImageUrl({
  formData,
  bucket,
  folder,
  fallback = null,
}: {
  formData: FormData;
  bucket: string;
  folder: string;
  fallback?: string | null;
}) {
  const directUrl = String(formData.get("image_url") ?? "").trim();
  const imageFile = formData.get("image_file");

  if (imageFile instanceof File && imageFile.size > 0) {
    if (!allowedImageTypes.has(imageFile.type)) {
      throw new Error("이미지는 PNG, JPG, WEBP, GIF 파일만 업로드할 수 있습니다.");
    }

    if (imageFile.size > 8 * 1024 * 1024) {
      throw new Error("이미지는 8MB 이하만 업로드할 수 있습니다.");
    }

    const supabase = await createSupabaseServiceClient();
    await supabase.storage.createBucket(bucket, { public: true }).catch(() => null);

    const extension = imageFile.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "png";
    const path = `${folder}/${crypto.randomUUID()}.${extension}`;
    const { error } = await supabase.storage.from(bucket).upload(path, imageFile, {
      contentType: imageFile.type,
      upsert: false,
    });

    if (error) {
      throw new Error(`이미지 업로드에 실패했습니다: ${error.message}`);
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  }

  return directUrl || fallback;
}

async function resolveNoticeImageUrl(formData: FormData, fallback: string | null = null) {
  return resolveUploadedImageUrl({ formData, bucket: "notice-images", folder: "posts", fallback });
}

async function resolveProductImageUrl(formData: FormData, fallback: string | null = null) {
  return resolveUploadedImageUrl({ formData, bucket: "shop-images", folder: "products", fallback });
}

export async function createNoticeAction(formData: FormData) {
  await assertAdmin();

  if (!hasSupabaseEnv()) {
    revalidatePath("/admin/notices");
    return;
  }

  const title = String(formData.get("title") ?? "");
  const supabase = await createSupabaseServiceClient();
  await supabase.from("notices").insert({
    title,
    slug: slugify(title),
    excerpt: String(formData.get("excerpt") ?? ""),
    content: String(formData.get("content") ?? ""),
    category: String(formData.get("category") ?? "notice") as Notice["category"],
    image_url: await resolveNoticeImageUrl(formData),
    published: formData.get("published") === "on",
  });
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
  const currentImageUrl = String(formData.get("current_image_url") ?? "").trim() || null;
  const supabase = await createSupabaseServiceClient();
  await supabase
    .from("notices")
    .update({
      title,
      slug: slugify(title),
      excerpt: String(formData.get("excerpt") ?? ""),
      content: String(formData.get("content") ?? ""),
      category: String(formData.get("category") ?? "notice") as Notice["category"],
      image_url: await resolveNoticeImageUrl(formData, currentImageUrl),
      published: formData.get("published") === "on",
    })
    .eq("id", id);
  revalidatePath("/notices");
  revalidatePath("/admin/notices");
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

export async function createProductAction(formData: FormData) {
  await assertAdmin();

  if (!hasSupabaseEnv()) {
    revalidatePath("/admin/products");
    return;
  }

  const name = String(formData.get("name") ?? "");
  const supabase = await createSupabaseServiceClient();
  await supabase.from("products").insert({
    name,
    slug: slugify(name),
    description: String(formData.get("description") ?? ""),
    details: String(formData.get("details") ?? ""),
    price_krw: Number(formData.get("price_krw") ?? 0),
    cash_amount: Number(formData.get("cash_amount") ?? 0),
    image_url: await resolveProductImageUrl(formData),
    minecraft_item_key: String(formData.get("minecraft_item_key") ?? ""),
    active: formData.get("active") === "on",
  });
  revalidatePath("/shop");
  revalidatePath("/admin/products");
}

export async function updateProductAction(formData: FormData) {
  await assertAdmin();

  if (!hasSupabaseEnv()) {
    revalidatePath("/admin/products");
    return;
  }

  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "");
  const currentImageUrl = String(formData.get("current_image_url") ?? "").trim() || null;
  const supabase = await createSupabaseServiceClient();
  await supabase
    .from("products")
    .update({
      name,
      slug: slugify(name),
      description: String(formData.get("description") ?? ""),
      details: String(formData.get("details") ?? ""),
      price_krw: Number(formData.get("price_krw") ?? 0),
      cash_amount: Number(formData.get("cash_amount") ?? 0),
      image_url: await resolveProductImageUrl(formData, currentImageUrl),
      minecraft_item_key: String(formData.get("minecraft_item_key") ?? ""),
      active: formData.get("active") === "on",
    })
    .eq("id", id);
  revalidatePath("/shop");
  revalidatePath("/admin/products");
}

export async function deleteProductAction(formData: FormData) {
  await assertAdmin();

  if (!hasSupabaseEnv()) {
    revalidatePath("/admin/products");
    return;
  }

  const id = String(formData.get("id") ?? "");
  const supabase = await createSupabaseServiceClient();
  await supabase.from("products").delete().eq("id", id);
  revalidatePath("/shop");
  revalidatePath("/admin/products");
}
