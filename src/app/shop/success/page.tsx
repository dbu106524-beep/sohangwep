import Link from "next/link";
import { PageHero } from "@/components/page-hero";

export default async function PaymentSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const { order } = await searchParams;

  return (
    <main>
      <PageHero
        eyebrow="Payment test"
        title="테스트 결제가 완료되었어요"
        description="실제 PG 결제는 아직 연결하지 않았습니다. 후원과 마인크래프트 지급 API 연동 구조를 확인하기 위한 성공 화면입니다."
      />
      <section className="section-shell glass-card rounded-3xl p-8 profile-panel-readable">
        <p className="font-mono text-sm text-white">주문 참조: {order ?? "test-order"}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/profile" className="planet-button bg-[#2d235d] text-white">
            구매 내역 보기
          </Link>
          <Link href="/shop" className="planet-button bg-white text-[#5c4aa8]">
            상점으로 돌아가기
          </Link>
        </div>
      </section>
    </main>
  );
}
