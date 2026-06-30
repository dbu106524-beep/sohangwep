import type { Purchase } from "@/lib/types";

export const purchaseStatusLabels: Record<Purchase["status"], string> = {
  pending: "지급전",
  paid: "지급대기",
  fulfilled: "지급완료",
  failed: "지급오류",
  refunded: "환불완료",
  shipped: "배송중",
  delivered: "배송완료",
};

export const purchaseStatusOptions: Array<{ value: Purchase["status"]; label: string }> = [
  { value: "pending", label: "지급전" },
  { value: "paid", label: "지급대기" },
  { value: "fulfilled", label: "지급완료" },
  { value: "failed", label: "지급오류" },
  { value: "refunded", label: "환불완료" },
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
