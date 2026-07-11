import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { fulfillPaidPurchase } from "@/lib/fulfillment";
import { createSupabaseServiceClient, hasSupabaseEnv } from "@/lib/supabase/server";

function signaturesMatch(actual: string, expected: string) {
  const actualBytes = Buffer.from(actual);
  const expectedBytes = Buffer.from(expected);

  if (actualBytes.length !== expectedBytes.length) {
    return false;
  }

  return timingSafeEqual(actualBytes, expectedBytes);
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-payment-signature");
  const expectedSignature = process.env.PAYMENT_WEBHOOK_SECRET;

  if (!expectedSignature) {
    return NextResponse.json({ error: "Payment webhook is not configured." }, { status: 503 });
  }

  if (!signature || !signaturesMatch(signature, expectedSignature)) {
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 401 });
  }

  const event = (await Promise.resolve()
    .then(() => JSON.parse(rawBody || "{}"))
    .catch(() => null)) as {
    type?: string;
    purchaseId?: string;
    paymentReference?: string;
  } | null;

  if (!event) {
    return NextResponse.json({ error: "Invalid webhook payload." }, { status: 400 });
  }

  if (event.type !== "payment.succeeded") {
    return NextResponse.json({ received: true, ignored: true });
  }

  const purchaseId = event.purchaseId;

  if (!purchaseId) {
    return NextResponse.json({ error: "purchaseId is required." }, { status: 400 });
  }

  if (hasSupabaseEnv()) {
    const supabase = await createSupabaseServiceClient();
    await supabase
      .from("purchases")
      .update({
        status: "paid",
        payment_reference: event.paymentReference ?? purchaseId,
      })
      .eq("id", purchaseId);
  }

  await fulfillPaidPurchase(purchaseId);

  return NextResponse.json({
    received: true,
    purchaseId,
  });
}
