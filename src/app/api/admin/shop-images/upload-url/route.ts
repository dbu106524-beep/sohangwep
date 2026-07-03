import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseServiceClient } from "@/lib/supabase/server";

const allowedImageTypes = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);

function getExtension(fileName: string, contentType: string) {
  const fromName = fileName.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (fromName) {
    return fromName;
  }

  if (contentType === "image/jpeg") {
    return "jpg";
  }

  return contentType.split("/").pop()?.replace(/[^a-z0-9]/g, "") || "webp";
}

export async function POST(request: Request) {
  const { allowed } = await requireAdmin("/admin/products");

  if (!allowed) {
    return NextResponse.json({ error: "관리자만 상품 이미지를 업로드할 수 있습니다." }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as { fileName?: string; contentType?: string } | null;
  const fileName = body?.fileName || "product.webp";
  const contentType = body?.contentType || "image/webp";

  if (!allowedImageTypes.has(contentType)) {
    return NextResponse.json({ error: "PNG, JPG, WEBP, GIF 이미지만 업로드할 수 있습니다." }, { status: 400 });
  }

  const supabase = await createSupabaseServiceClient();
  const extension = getExtension(fileName, contentType);
  const path = `products/${crypto.randomUUID()}.${extension}`;
  const { data, error } = await supabase.storage.from("shop-images").createSignedUploadUrl(path);

  if (error || !data?.token) {
    return NextResponse.json({ error: error?.message || "업로드 URL을 만들 수 없습니다." }, { status: 500 });
  }

  const { data: publicData } = supabase.storage.from("shop-images").getPublicUrl(path);

  return NextResponse.json({
    path,
    token: data.token,
    publicUrl: publicData.publicUrl,
  });
}
