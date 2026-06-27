import { PolicyPage } from "@/components/policy-page";

export default function ServiceTermsPage() {
  return (
    <PolicyPage
      title="이용약관"
      description="소행성 공식 홈페이지와 상점 이용에 필요한 기본 약관입니다."
      sections={[
        ["서비스 목적", "소행성 홈페이지는 서버 공지, 업데이트, 커뮤니티, 상점, 구매 내역 확인 기능을 제공합니다."],
        ["계정과 인증", "Discord OAuth 로그인으로 계정을 식별하며, 부정 이용 또는 타인 계정 사용은 제한될 수 있습니다."],
        ["상점 이용", "테스트 모드에서는 실제 결제가 발생하지 않습니다. 정식 결제 연동 후 상품 지급은 결제 성공 확인 후 처리됩니다."],
        ["운영 제한", "서버 운영 정책을 위반하거나 시스템을 악용하는 행위는 이용 제한 또는 구매 취소 사유가 될 수 있습니다."],
      ]}
    />
  );
}
