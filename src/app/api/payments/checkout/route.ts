import { NextResponse } from "next/server";
import { getCurrentUser, getDemoUser } from "@/lib/auth";
import { getProducts } from "@/lib/data";
import { notifyDonationOrderCreated } from "@/lib/discord-webhook";
import { createSupabaseServerClient, hasSupabaseEnv } from "@/lib/supabase/server";
import { getDiscountedPrice, getSiteUrl } from "@/lib/utils";

type CheckoutBody = {
  productId?: string;
  paymentMethod?: "bank_transfer" | "test";
  shippingRecipient?: string;
  shippingPhone?: string;
  shippingAddress?: string;
  shippingMessage?: string;
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as CheckoutBody | null;
  const productId = body?.productId;

  if (!productId) {
    return NextResponse.json({ error: "productId is required." }, { status: 400 });
  }

  const products = await getProducts();
  const product = products.find((item) => item.id === productId);

  if (!product) {
    return NextResponse.json({ error: "상품을 찾을 수 없습니다." }, { status: 404 });
  }

  const user = (await getCurrentUser()) ?? (!hasSupabaseEnv() ? await getDemoUser() : null);

  if (!user) {
    return NextResponse.json({ error: "디스코드 로그인이 필요합니다." }, { status: 401 });
  }

  const productKind = product.product_kind ?? "credit";
  const paymentMethod = body?.paymentMethod === "bank_transfer" ? "bank_transfer" : "test";

  if (paymentMethod === "test" && !user.isAdmin) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  if (productKind === "goods" && !user.isAdmin) {
    return NextResponse.json({ error: "굿즈 주문은 아직 관리자 테스트만 가능합니다." }, { status: 403 });
  }

  if (productKind === "goods" && paymentMethod !== "test") {
    return NextResponse.json({ error: "굿즈는 아직 테스트 주문만 가능합니다." }, { status: 400 });
  }

  if (productKind === "credit" && paymentMethod !== "bank_transfer" && !user.isAdmin) {
    return NextResponse.json({ error: "스타 크레딧은 무통장 입금으로 신청해주세요." }, { status: 400 });
  }

  const amountKrw = getDiscountedPrice(product.price_krw, product.discount_percent);
  const shippingRecipient = String(body?.shippingRecipient ?? "").trim();
  const shippingPhone = String(body?.shippingPhone ?? "").trim();
  const shippingAddress = String(body?.shippingAddress ?? "").trim();
  const shippingMessage = String(body?.shippingMessage ?? "").trim();

  if (productKind === "goods" && (!shippingRecipient || !shippingPhone || !shippingAddress)) {
    return NextResponse.json({ error: "굿즈 주문에는 받는 사람, 연락처, 배송지 주소가 필요합니다." }, { status: 400 });
  }

  const orderReference = `${paymentMethod === "bank_transfer" ? "AST" : "test"}_${Date.now()}`;
  let purchaseId = orderReference;

  if (hasSupabaseEnv()) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("purchases")
      .insert({
        user_id: user.id,
        product_id: product.id,
        product_name: product.name,
        amount_krw: amountKrw,
        product_kind: productKind,
        shipping_recipient: productKind === "goods" ? shippingRecipient : null,
        shipping_phone: productKind === "goods" ? shippingPhone : null,
        shipping_address: productKind === "goods" ? shippingAddress : null,
        shipping_message: productKind === "goods" ? shippingMessage : null,
        tracking_carrier: null,
        tracking_number: null,
        shipped_at: null,
        donation_ticket_channel_id: null,
        donation_depositor: null,
        donation_reported_at: null,
        donation_note: null,
        fulfilled_at: null,
        status: "pending",
        payment_provider: paymentMethod,
        payment_reference: orderReference,
      })
      .select("id")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    purchaseId = data.id;
  }

  if (paymentMethod === "bank_transfer" && productKind === "credit") {
    await notifyDonationOrderCreated(purchaseId, {
      orderId: purchaseId,
      orderReference,
      productName: product.name,
      amountKrw,
      cashAmount: product.cash_amount ?? 0,
      minecraftItemKey: product.minecraft_item_key ?? "",
      userId: user.id,
      discordId: user.discordId ?? "",
      displayName: user.name,
      minecraftUuid: user.profile?.minecraft_uuid ?? "",
      minecraftAccountName: user.profile?.minecraft_account_name ?? "",
      minecraftName: user.profile?.minecraft_name ?? user.profile?.minecraft_account_name ?? "",
      createdAt: new Date().toISOString(),
      orderUrl: `${getSiteUrl()}/profile/purchases`,
    });
  }

  return NextResponse.json({
    mode: paymentMethod,
    purchaseId,
    redirectUrl: `${getSiteUrl()}/shop/success?order=${encodeURIComponent(purchaseId)}&mode=${paymentMethod}`,
  });
}
