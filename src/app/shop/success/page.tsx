import Link from "next/link";
import { PageHero } from "@/components/page-hero";

export default async function PaymentSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string; mode?: string }>;
}) {
  const { order, mode } = await searchParams;
  const isBankTransfer = mode === "bank_transfer";
  const isGoods = mode === "goods";
  const isManualPayment = isBankTransfer || isGoods;

  return (
    <main>
      <PageHero
        eyebrow={isGoods ? "Goods order" : isBankTransfer ? "Star Credit order" : "Order received"}
        title={isGoods ? "굿즈 주문이 접수되었습니다" : isBankTransfer ? "스타 크레딧 구매 신청이 접수되었습니다" : "주문이 접수되었습니다"}
        description={
          isManualPayment
            ? "잠시 후 디스코드에 전용 결제 확인 채널이 열립니다. 채널에서 계좌 안내를 확인한 뒤 입금 완료 버튼을 눌러 주세요."
            : "주문이 접수되었습니다. 구매내역에서 상태를 확인할 수 있습니다."
        }
      />
      <section className="section-shell glass-card rounded-3xl p-8 profile-panel-readable">
        <p className="font-mono text-sm text-white">주문번호: {order ?? "order"}</p>
        {isManualPayment ? (
          <div className="notice-box mt-6">
            디스코드 결제 확인 채널이 열리면 안내된 계좌로 입금한 뒤 입금 완료 버튼을 눌러 주세요. 관리자가 확인하면 주문 상태가 갱신됩니다.
            굿즈 배송지와 연락처는 개인정보 보호를 위해 웹 관리자 페이지에서만 확인됩니다.
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
