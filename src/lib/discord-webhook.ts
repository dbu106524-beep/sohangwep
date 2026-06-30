export async function notifyDonationOrderCreated(orderId: string) {
  const webhookUrl = process.env.DISCORD_DONATION_WEBHOOK_URL || process.env.DISCORD_NOTICE_WEBHOOK_URL;

  if (!webhookUrl || !orderId) {
    return;
  }

  await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: "소행성 후원",
      content: `SOHANG_DONATION_ORDER_CREATED ${orderId}`,
      allowed_mentions: { parse: [] },
    }),
  }).catch((error) => {
    console.warn("[Donation webhook]", error);
  });
}
