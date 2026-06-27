import { PolicyPage } from "@/components/policy-page";

export default function PrivacyPage() {
  return (
    <PolicyPage
      title="개인정보처리방침"
      description="Discord OAuth와 상점 이용 과정에서 처리되는 정보를 안내합니다."
      sections={[
        ["수집 항목", "Discord ID, 표시 이름, 아바타 URL, 마인크래프트 UUID와 닉네임, 구매 내역, 스타 크레딧 잔액을 처리할 수 있습니다."],
        ["이용 목적", "로그인 식별, 관리자 권한 확인, 커뮤니티 작성 권한 확인, 결제 내역 관리, 아이템 지급 요청, 고객 문의 처리를 위해 사용합니다."],
        ["보관 기간", "서비스 운영과 분쟁 대응에 필요한 기간 동안 보관하며, 법령 또는 운영 정책에 따라 삭제할 수 있습니다."],
        ["제3자 제공", "정식 결제 연동 후 결제 처리를 위해 PG사에 필요한 최소 정보가 전달될 수 있습니다."],
      ]}
    />
  );
}
