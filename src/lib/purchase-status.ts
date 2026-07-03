import type { Purchase } from "@/lib/types";

export const purchaseStatusLabels: Record<Purchase["status"], string> = {
  pending: "입금대기",
  paid: "입금확인중",
  fulfilled: "지급/확인완료",
  failed: "처리오류",
  refunded: "환불/거절",
  shipped: "배송중",
  delivered: "배송완료",
};

export const purchaseStatusOptions: Array<{ value: Purchase["status"]; label: string }> = [
  { value: "pending", label: "입금대기" },
  { value: "paid", label: "입금확인중" },
  { value: "fulfilled", label: "지급/확인완료" },
  { value: "failed", label: "처리오류" },
  { value: "refunded", label: "환불/거절" },
  { value: "shipped", label: "배송중" },
  { value: "delivered", label: "배송완료" },
];

export function getTrackingUrl(carrier?: string | null, trackingNumber?: string | null) {
  if (!trackingNumber) {
    return null;
  }

  const query = [carrier, trackingNumber].filter(Boolean).join(" ");
  return `https://search.naver.com/search.naver?query=${encodeURIComponent(`${query} 배송조회`)}`;
}
