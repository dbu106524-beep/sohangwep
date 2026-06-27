import { createSupabaseServiceClient, hasSupabaseEnv } from "@/lib/supabase/server";

export type GrantPayload = {
  orderId: string;
  userId: string;
  productId: string;
  minecraftItemKey: string;
  quantity?: number;
};

export async function requestMinecraftGrant(payload: GrantPayload) {
  const grantUrl = process.env.MINECRAFT_SERVER_GRANT_URL;

  if (!grantUrl) {
    return {
      queued: true,
      delivered: false,
      message: "MINECRAFT_SERVER_GRANT_URL is not configured. Grant request is queued for future plugin integration.",
      payload,
    };
  }

  const response = await fetch(grantUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-minecraft-api-key": process.env.MINECRAFT_GRANT_API_KEY ?? "",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Minecraft grant request failed: ${response.status}`);
  }

  return {
    queued: false,
    delivered: true,
    message: "Grant request delivered to Minecraft server.",
    payload,
  };
}

export async function fulfillPaidPurchase(purchaseId: string) {
  if (!hasSupabaseEnv()) {
    return requestMinecraftGrant({
      orderId: purchaseId,
      userId: "demo-user",
      productId: "demo-product",
      minecraftItemKey: "demo_item",
      quantity: 1,
    });
  }

  const supabase = await createSupabaseServiceClient();
  const { data: purchase, error } = await supabase
    .from("purchases")
    .select("*")
    .eq("id", purchaseId)
    .maybeSingle();

  if (error || !purchase) {
    throw new Error("Purchase not found.");
  }

  const { data: product } = await supabase
    .from("products")
    .select("*")
    .eq("id", purchase.product_id)
    .maybeSingle();

  if (!product) {
    throw new Error("Product not found.");
  }

  const grant = await requestMinecraftGrant({
    orderId: purchase.id,
    userId: purchase.user_id,
    productId: product.id,
    minecraftItemKey: product.minecraft_item_key,
    quantity: 1,
  });

  await supabase.from("purchases").update({ status: grant.delivered ? "fulfilled" : "paid" }).eq("id", purchase.id);

  return grant;
}
