import { NextResponse } from "next/server";
import { createSupabaseServiceClient, hasSupabaseEnv } from "@/lib/supabase/server";
import type { Purchase } from "@/lib/types";
import { getSiteUrl } from "@/lib/utils";

function authorized(request: Request) {
  const expectedKey = process.env.INTERNAL_DINBU_DISCORD_KEY || process.env.INTERNAL_DONATION_KEY;
  const actualKey = request.headers.get("x-internal-key");
  return Boolean(expectedKey && actualKey && expectedKey === actualKey);
}

export async function GET(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (!hasSupabaseEnv()) {
    return NextResponse.json({ tickets: [] });
  }

  const supabase = await createSupabaseServiceClient();
  const { data: purchases, error } = await supabase
    .from("purchases")
    .select("*")
    .eq("product_kind", "credit")
    .eq("payment_provider", "bank_transfer")
    .eq("status", "pending")
    .is("donation_ticket_channel_id", null)
    .order("created_at", { ascending: true })
    .limit(5);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const productIds = [...new Set((purchases ?? []).map((purchase) => purchase.product_id).filter(Boolean))];
  const userIds = [...new Set((purchases ?? []).map((purchase) => purchase.user_id).filter(Boolean))];

  const [{ data: products }, { data: profiles }] = await Promise.all([
    productIds.length
      ? supabase.from("products").select("id,cash_amount,minecraft_item_key").in("id", productIds)
      : Promise.resolve({ data: [] }),
    userIds.length
      ? supabase
          .from("profiles")
          .select("id,discord_id,display_name,minecraft_uuid,minecraft_account_name,minecraft_name")
          .in("id", userIds)
      : Promise.resolve({ data: [] }),
  ]);

  const productById = new Map((products ?? []).map((product) => [product.id, product]));
  const profileById = new Map((profiles ?? []).map((profile) => [profile.id, profile]));

  const tickets = (purchases ?? []).map((purchase) => {
    const product = productById.get(purchase.product_id);
    const profile = profileById.get(purchase.user_id);

    return {
      orderId: purchase.id,
      orderReference: purchase.payment_reference,
      productName: purchase.product_name,
      amountKrw: purchase.amount_krw,
      cashAmount: product?.cash_amount ?? 0,
      minecraftItemKey: product?.minecraft_item_key ?? "",
      userId: purchase.user_id,
      discordId: profile?.discord_id ?? "",
      displayName: profile?.display_name ?? "",
      minecraftUuid: profile?.minecraft_uuid ?? "",
      minecraftAccountName: profile?.minecraft_account_name ?? "",
      minecraftName: profile?.minecraft_name ?? profile?.minecraft_account_name ?? "",
      createdAt: purchase.created_at,
      orderUrl: `${getSiteUrl()}/profile/purchases`,
    };
  });

  return NextResponse.json({ tickets });
}

export async function POST(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (!hasSupabaseEnv()) {
    return NextResponse.json({ ok: true });
  }

  const body = (await request.json().catch(() => null)) as {
    action?: string;
    orderId?: string;
    channelId?: string;
    depositor?: string;
    actor?: string;
    note?: string;
  } | null;

  if (!body?.orderId || !body.action) {
    return NextResponse.json({ error: "orderId and action are required." }, { status: 400 });
  }

  const now = new Date().toISOString();
  const update: Partial<Purchase> = {};

  if (body.action === "ticket_created") {
    update.donation_ticket_channel_id = body.channelId ?? null;
    update.donation_note = body.note ?? null;
  } else if (body.action === "deposit_reported") {
    update.donation_depositor = body.depositor ?? null;
    update.donation_reported_at = now;
    update.status = "paid";
    update.donation_note = body.note ?? null;
  } else if (body.action === "fulfilled") {
    update.status = "fulfilled";
    update.fulfilled_at = now;
    update.donation_note = body.note ?? body.actor ?? null;
  } else if (body.action === "failed") {
    update.status = "failed";
    update.donation_note = body.note ?? null;
  } else if (body.action === "rejected") {
    update.status = "refunded";
    update.donation_note = body.note ?? null;
  } else {
    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  }

  const supabase = await createSupabaseServiceClient();
  const { error } = await supabase.from("purchases").update(update).eq("id", body.orderId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
