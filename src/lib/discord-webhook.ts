type DonationOrderPayload = {
  orderId: string;
  orderReference: string;
  productKind: "credit" | "goods";
  productName: string;
  amountKrw: number;
  cashAmount: number;
  minecraftItemKey: string;
  userId: string;
  discordId: string;
  displayName: string;
  minecraftUuid: string;
  minecraftAccountName: string;
  minecraftName: string;
  createdAt: string;
  orderUrl: string;
};

function encodePayload(payload: DonationOrderPayload) {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

export async function notifyDonationOrderCreated(orderId: string, payload?: DonationOrderPayload) {
  const webhookUrl = process.env.DISCORD_DONATION_WEBHOOK_URL || process.env.DISCORD_NOTICE_WEBHOOK_URL;

  if (!webhookUrl || !orderId) {
    return;
  }

  const signal = payload
    ? `SOHANG_DONATION_ORDER_CREATED_V2 ${encodePayload(payload)}`
    : `SOHANG_DONATION_ORDER_CREATED ${orderId}`;

  await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: "소행성 후원",
      content: signal,
      allowed_mentions: { parse: [] },
    }),
  }).catch((error) => {
    console.warn("[Donation webhook]", error);
  });
}
