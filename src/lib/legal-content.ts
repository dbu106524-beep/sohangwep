import type { LegalPage, LegalPageSlug } from "@/lib/types";

export const legalPageLabels: Record<LegalPageSlug, string> = {
  service: "이용약관",
  privacy: "개인정보처리방침",
  refund: "환불정책",
};

export const defaultLegalPages: Record<LegalPageSlug, LegalPage> = {
  service: {
    slug: "service",
    title: "이용약관",
    description: "소행성 공식 홈페이지와 상점 이용에 필요한 기본 약관입니다.",
    content: [
      "서비스 목적\n소행성 홈페이지는 서버 공지, 업데이트, 커뮤니티, 상점, 구매 내역 확인 기능을 제공합니다.",
      "계정과 인증\nDiscord OAuth 로그인으로 계정을 연결하며, 부정 이용 또는 타인 계정 사용은 제한될 수 있습니다.",
      "상점 이용\n테스트 모드에서는 실제 결제가 발생하지 않습니다. 정식 결제 연동 후 상품 지급은 결제 성공 확인 후 처리됩니다.",
      "운영 제한\n서버 운영 정책을 위반하거나 시스템을 악용하는 행위는 이용 제한 또는 구매 취소 사유가 될 수 있습니다.",
    ].join("\n\n"),
    updated_at: new Date(0).toISOString(),
  },
  privacy: {
    slug: "privacy",
    title: "개인정보처리방침",
    description: "Discord OAuth와 상점 이용 과정에서 처리되는 정보를 안내합니다.",
    content: [
      "수집 항목\nDiscord ID, 표시 이름, 아바타 URL, 마인크래프트 UUID와 닉네임, 구매 내역, 스타 크레딧 잔액을 처리할 수 있습니다.",
      "이용 목적\n로그인, 관리자 권한 확인, 커뮤니티 작성 권한 확인, 결제 내역 관리, 아이템 지급 요청, 고객 문의 처리를 위해 사용합니다.",
      "보관 기간\n서비스 운영과 분쟁 대응에 필요한 기간 동안 보관하며, 법령 또는 운영 정책에 따라 삭제할 수 있습니다.",
      "제3자 제공\n정식 결제 연동 후 결제 처리를 위해 PG사에 필요한 최소 정보가 전달될 수 있습니다.",
    ].join("\n\n"),
    updated_at: new Date(0).toISOString(),
  },
  refund: {
    slug: "refund",
    title: "환불정책",
    description: "상점 상품의 환불 기준과 문의 흐름을 안내합니다.",
    content: [
      "테스트 모드\n현재 테스트 모드에서는 실제 결제가 발생하지 않으므로 환불 처리 대상 금액이 없습니다.",
      "정식 결제 후\n상품이 아직 지급되지 않은 경우 결제 취소 또는 환불이 가능하도록 운영 정책을 적용합니다.",
      "지급 완료 상품\n서버 재화 또는 아이템이 사용된 경우 환불이 제한될 수 있습니다.",
      "문의 방법\n디스코드 문의 채널로 주문번호, Discord ID, 마인크래프트 닉네임을 함께 제출해 주세요.",
    ].join("\n\n"),
    updated_at: new Date(0).toISOString(),
  },
};
