import { NextResponse } from "next/server";
import { fulfillPaidPurchase } from "@/lib/fulfillment";
import { createSupabaseServiceClient, hasSupabaseEnv } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-payment-signature");
  const expectedSignature = process.env.PAYMENT_WEBHOOK_SECRET;

  if (expectedSignature && signature && signature !== expectedSignature) {
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 400 });
  }

  const event = JSON.parse(rawBody || "{}") as {
    type?: string;
    purchaseId?: string;
    paymentReference?: string;
  };

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

  const grant = await fulfillPaidPurchase(purchaseId);

  return NextResponse.json({
    received: true,
    purchaseId,
    grant,
  });
}
