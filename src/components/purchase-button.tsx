"use client";

import { useState } from "react";

export function PurchaseButton({ productId }: { productId: string }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function checkout() {
    setPending(true);
    setError(null);

    const response = await fetch("/api/payments/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId }),
    });
    const data = (await response.json()) as { redirectUrl?: string; error?: string };

    setPending(false);

    if (!response.ok || !data.redirectUrl) {
      setError(data.error ?? "결제 준비 중 문제가 발생했어요.");
      return;
    }

    window.location.href = data.redirectUrl;
  }

  return (
    <div>
      <button type="button" onClick={checkout} disabled={pending} className="button primary">
        {pending ? "결제 준비 중..." : "테스트 결제하기"}
      </button>
      {error ? <p className="status-line error">{error}</p> : null}
    </div>
  );
}
