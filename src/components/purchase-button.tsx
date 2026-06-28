"use client";

import { useState } from "react";

type ProductKind = "credit" | "goods";

export function PurchaseButton({ productId, productKind = "credit" }: { productId: string; productKind?: ProductKind }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [shippingRecipient, setShippingRecipient] = useState("");
  const [shippingPhone, setShippingPhone] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [shippingMessage, setShippingMessage] = useState("");

  const isGoods = productKind === "goods";

  async function checkout() {
    setPending(true);
    setError(null);
    setShowErrorPopup(false);

    const response = await fetch("/api/payments/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId,
        shippingRecipient,
        shippingPhone,
        shippingAddress,
        shippingMessage,
      }),
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
    <div className="purchase-box">
      {isGoods ? (
        <div className="shipping-form">
          <label>
            <span>받는 사람</span>
            <input value={shippingRecipient} onChange={(event) => setShippingRecipient(event.target.value)} placeholder="받는 사람 이름" />
          </label>
          <label>
            <span>연락처</span>
            <input value={shippingPhone} onChange={(event) => setShippingPhone(event.target.value)} placeholder="010-0000-0000" />
          </label>
          <label>
            <span>배송지 주소</span>
            <input value={shippingAddress} onChange={(event) => setShippingAddress(event.target.value)} placeholder="주소를 입력해 주세요" />
          </label>
          <label>
            <span>배송메시지</span>
            <textarea value={shippingMessage} onChange={(event) => setShippingMessage(event.target.value)} placeholder="문 앞에 놓아주세요 등" rows={3} />
          </label>
        </div>
      ) : null}

      <button type="button" onClick={checkout} disabled={pending} className="button primary">
        {pending ? "결제 준비 중..." : isGoods ? "굿즈 테스트 주문하기" : "테스트 결제하기"}
      </button>

      {showErrorPopup && error ? (
        <div className="purchase-popup" role="alert">
          <div className="purchase-popup-box">
            <strong>{error}</strong>
            <p>현재 테스트 주문과 결제는 관리자만 사용할 수 있습니다.</p>
            <button type="button" className="button primary" onClick={() => setShowErrorPopup(false)}>
              확인
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
