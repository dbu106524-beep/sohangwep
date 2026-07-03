"use client";

import { useState } from "react";

type ProductKind = "credit" | "goods";
type PaymentMethod = "bank_transfer" | "test";

type DaumPostcodeData = {
  zonecode: string;
  address: string;
  roadAddress: string;
  jibunAddress: string;
  bname: string;
  buildingName: string;
  apartment: string;
};

declare global {
  interface Window {
    daum?: {
      Postcode: new (options: { oncomplete: (data: DaumPostcodeData) => void }) => { open: () => void };
    };
  }
}

const postcodeScriptId = "daum-postcode-script";

export function PurchaseButton({ productId, productKind = "credit" }: { productId: string; productKind?: ProductKind }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [shippingRecipient, setShippingRecipient] = useState("");
  const [shippingPhone, setShippingPhone] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [shippingBaseAddress, setShippingBaseAddress] = useState("");
  const [shippingDetailAddress, setShippingDetailAddress] = useState("");
  const [shippingMessage, setShippingMessage] = useState("");

  const isGoods = productKind === "goods";

  function showError(message: string) {
    setPending(false);
    setError(message);
    setShowErrorPopup(true);
  }

  function openAddressSearch() {
    const openPostcode = () => {
      if (!window.daum?.Postcode) {
        showError("주소 검색을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.");
        return;
      }

      new window.daum.Postcode({
        oncomplete(data) {
          const baseAddress = data.roadAddress || data.address || data.jibunAddress;
          const extras = [];

          if (data.roadAddress) {
            if (data.bname) extras.push(data.bname);
            if (data.buildingName && data.apartment === "Y") extras.push(data.buildingName);
          }

          setPostalCode(data.zonecode);
          setShippingBaseAddress(`${baseAddress}${extras.length ? ` (${extras.join(", ")})` : ""}`);
          setShippingDetailAddress("");
        },
      }).open();
    };

    if (window.daum?.Postcode) {
      openPostcode();
      return;
    }

    const existingScript = document.getElementById(postcodeScriptId) as HTMLScriptElement | null;
    if (existingScript) {
      existingScript.addEventListener("load", openPostcode, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = postcodeScriptId;
    script.src = "https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
    script.async = true;
    script.onload = openPostcode;
    script.onerror = () => showError("주소 검색 스크립트를 불러오지 못했습니다.");
    document.body.appendChild(script);
  }

  async function checkout(paymentMethod: PaymentMethod) {
    setError(null);
    setShowErrorPopup(false);

    const fullShippingAddress = [`[${postalCode}]`, shippingBaseAddress, shippingDetailAddress]
      .filter((part) => part.replace(/\[\]/g, "").trim())
      .join(" ")
      .trim();

    if (isGoods && (!shippingRecipient.trim() || !shippingPhone.trim() || !shippingBaseAddress.trim() || !shippingDetailAddress.trim())) {
      showError("굿즈 주문에는 받는 사람, 연락처, 주소 검색, 상세주소가 필요합니다.");
      return;
    }

    setPending(true);

    const response = await fetch("/api/payments/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId,
        paymentMethod,
        shippingRecipient,
        shippingPhone,
        shippingAddress: fullShippingAddress,
        shippingMessage,
      }),
    });
    const data = (await response.json()) as { redirectUrl?: string; error?: string };

    setPending(false);

    if (!response.ok || !data.redirectUrl) {
      showError(data.error ?? "주문 처리 중 문제가 발생했습니다.");
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
            <div className="address-search-row">
              <input value={postalCode} readOnly placeholder="우편번호" />
              <button type="button" className="button ghost" onClick={openAddressSearch}>
                주소 검색
              </button>
            </div>
            <input value={shippingBaseAddress} readOnly placeholder="주소 검색 버튼을 눌러 주세요" />
          </label>
          <label>
            <span>상세주소</span>
            <input value={shippingDetailAddress} onChange={(event) => setShippingDetailAddress(event.target.value)} placeholder="동, 호수 등 상세주소" />
          </label>
          <label>
            <span>배송메시지</span>
            <textarea value={shippingMessage} onChange={(event) => setShippingMessage(event.target.value)} placeholder="문 앞에 놓아주세요 등" rows={3} />
          </label>
          <button type="button" onClick={() => checkout("bank_transfer")} disabled={pending} className="button primary">
            {pending ? "주문 접수 중..." : "굿즈 주문하기"}
          </button>
        </div>
      ) : (
        <div className="payment-method-box">
          <p className="font-black text-white">결제 방법</p>
          <button type="button" onClick={() => checkout("bank_transfer")} disabled={pending} className="button primary">
            {pending ? "구매 신청 중..." : "무통장 입금으로 스타 크레딧 구매하기"}
          </button>
          <p className="text-sm font-bold text-white/70">
            구매 신청 후 디스코드에 전용 결제 확인 채널이 열립니다. 채널 안내에 따라 입금 후 입금자명을 남겨 주세요.
          </p>
        </div>
      )}

      {showErrorPopup && error ? (
        <div className="purchase-popup" role="alert">
          <div className="purchase-popup-box">
            <strong>{error}</strong>
            <p>다시 시도해도 문제가 계속되면 관리자에게 문의해 주세요.</p>
            <button type="button" className="button primary" onClick={() => setShowErrorPopup(false)}>
              확인
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
