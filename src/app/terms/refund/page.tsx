import { PolicyPage } from "@/components/policy-page";

export default function RefundPage() {
  return (
    <PolicyPage
      title="환불정책"
      description="상점 상품의 환불 기준과 문의 흐름을 안내합니다."
      sections={[
        ["테스트 모드", "현재 테스트 모드에서는 실제 결제가 발생하지 않으므로 환불 처리 대상 금액이 없습니다."],
        ["정식 결제 후", "상품이 아직 지급되지 않은 경우 결제 취소 또는 환불이 가능하도록 운영 정책을 적용합니다."],
        ["지급 완료 상품", "서버 재화 또는 아이템이 사용된 경우 환불이 제한될 수 있습니다."],
        ["문의 방법", "디스코드 문의 채널로 주문번호, Discord ID, 마인크래프트 닉네임을 함께 제출해 주세요."],
      ]}
    />
  );
}
