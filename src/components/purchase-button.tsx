"use client";

import { useState } from "react";

export function PurchaseButton({ productId }: { productId: string }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showErrorPopup, setShowErrorPopup] = useState(false);

  async function checkout() {
    setPending(true);
    setError(null);
    setShowErrorPopup(false);

    const response = await fetch("/api/payments/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId }),
    });
    const data = (await response.json()) as { redirectUrl?: string; error?: string };

    setPending(false);

    if (!response.ok || !data.redirectUrl) {
      setError(data.error ?? "결제 준비 중 문제가 발생했어요.");
      setShowErrorPopup(true);
      return;
    }

    window.location.href = data.redirectUrl;
  }

  return (
    <div>
      <button type="button" onClick={checkout} disabled={pending} className="button primary">
        {pending ? "결제 준비 중..." : "테스트 결제하기"}
      </button>
      {showErrorPopup && error ? (
        <div className="purchase-popup" role="alert">
          <div className="purchase-popup-box">
            <strong>{error}</strong>
            <p>테스트 결제는 관리자만 사용할 수 있습니다.</p>
            <button type="button" className="button primary" onClick={() => setShowErrorPopup(false)}>
              확인
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
