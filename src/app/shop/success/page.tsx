import Link from "next/link";
import { PageHero } from "@/components/page-hero";

export default async function PaymentSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string; mode?: string }>;
}) {
  const { order, mode } = await searchParams;
  const isBankTransfer = mode === "bank_transfer";

  return (
    <main>
      <PageHero
        eyebrow={isBankTransfer ? "Donation request" : "Order test"}
        title={isBankTransfer ? "후원 신청이 접수되었습니다" : "주문이 접수되었습니다"}
        description={
          isBankTransfer
            ? "잠시 후 디스코드에 전용 후원 채널이 열립니다. 채널에서 계좌 정보와 입금 안내를 확인해 주세요."
            : "테스트 주문이 접수되었습니다. 관리자 페이지에서 주문 상태를 확인할 수 있습니다."
        }
      />
      <section className="section-shell glass-card rounded-3xl p-8 profile-panel-readable">
        <p className="font-mono text-sm text-white">주문번호: {order ?? "order"}</p>
        {isBankTransfer ? (
          <div className="notice-box mt-6">
            디스코드 후원 채널이 열리면 안내된 계좌로 입금한 뒤 `!입금완료 입금자명`을 입력해 주세요. 관리자가 확인하면 스타크레딧이 인게임으로 지급됩니다.
          </div>
        ) : null}
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/profile/purchases" className="planet-button bg-[#2d235d] text-white">
            구매내역 보기
          </Link>
          <Link href="/shop" className="planet-button bg-white text-[#5c4aa8]">
            상점으로 돌아가기
          </Link>
        </div>
      </section>
    </main>
  );
}
