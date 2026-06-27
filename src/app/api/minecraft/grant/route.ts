import { NextResponse } from "next/server";
import { requestMinecraftGrant, type GrantPayload } from "@/lib/fulfillment";

export async function POST(request: Request) {
  const apiKey = request.headers.get("x-minecraft-api-key");
  const internalKey = request.headers.get("x-internal-fulfillment-key");
  const minecraftKey = process.env.MINECRAFT_GRANT_API_KEY;
  const fulfillmentKey = process.env.INTERNAL_FULFILLMENT_KEY;

  const authorized =
    (minecraftKey && apiKey === minecraftKey) || (fulfillmentKey && internalKey === fulfillmentKey);

  if (!authorized) {
    return NextResponse.json({ error: "Unauthorized grant request." }, { status: 401 });
  }

  const payload = (await request.json().catch(() => null)) as GrantPayload | null;

  if (!payload?.orderId || !payload.userId || !payload.productId || !payload.minecraftItemKey) {
    return NextResponse.json({ error: "Invalid grant payload." }, { status: 400 });
  }

  const grant = await requestMinecraftGrant(payload);
  return NextResponse.json(grant);
}
