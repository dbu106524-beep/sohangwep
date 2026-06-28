import { NextResponse } from "next/server";
import { getCurrentUser, getDemoUser } from "@/lib/auth";
import { getProducts } from "@/lib/data";
import { createSupabaseServerClient, hasSupabaseEnv } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/utils";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { productId?: string } | null;
  const productId = body?.productId;

  if (!productId) {
    return NextResponse.json({ error: "productId is required." }, { status: 400 });
  }

  const products = await getProducts();
  const product = products.find((item) => item.id === productId);

  if (!product) {
    return NextResponse.json({ error: "Product not found." }, { status: 404 });
  }

  const user = (await getCurrentUser()) ?? (!hasSupabaseEnv() ? await getDemoUser() : null);

  if (!user) {
    return NextResponse.json({ error: "Discord login is required." }, { status: 401 });
  }

  if (!user.isAdmin) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  const orderReference = `test_${Date.now()}`;
  let purchaseId = orderReference;

  if (hasSupabaseEnv()) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("purchases")
      .insert({
        user_id: user.id,
        product_id: product.id,
        product_name: product.name,
        amount_krw: product.price_krw,
        status: "pending",
        payment_provider: "test",
        payment_reference: orderReference,
      })
      .select("id")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    purchaseId = data.id;
  }

  return NextResponse.json({
    mode: process.env.PAYMENT_MODE ?? "test",
    purchaseId,
    redirectUrl: `${getSiteUrl()}/shop/success?order=${encodeURIComponent(purchaseId)}`,
  });
}
