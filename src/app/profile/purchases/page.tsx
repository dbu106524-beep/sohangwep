import { PageHero } from "@/components/page-hero";
import { requireCurrentUser } from "@/lib/auth";
import { getPurchases } from "@/lib/data";
import { getTrackingUrl, purchaseStatusLabels } from "@/lib/purchase-status";
import { formatDate, formatWon } from "@/lib/utils";

export default async function PurchasesPage() {
  const user = await requireCurrentUser("/profile/purchases");
  const history = await getPurchases(user.id);

  return (
    <main>
      <PageHero
        eyebrow="History"
        title="구매내역"
        description="구매한 상품의 지급 상태와 굿즈 배송 정보를 확인할 수 있습니다."
      />
      <section className="section-shell glass-card overflow-hidden rounded-3xl purchase-history">
        {history.length > 0 ? (
          <div className="grid gap-px bg-white/10">
            {history.map((purchase) => {
              const trackingUrl = getTrackingUrl(purchase.tracking_carrier, purchase.tracking_number);

              return (
                <div key={purchase.id} className="grid gap-4 bg-white/10 p-5 text-white md:grid-cols-[1.6fr_0.7fr_0.7fr_0.8fr] md:items-start">
                  <div className="space-y-3">
                    <strong className="text-lg text-white">{purchase.product_name}</strong>
                    {purchase.product_kind === "goods" ? (
                      <div className="rounded-2xl border border-white/15 bg-black/20 p-4 text-sm font-bold text-white/80">
                        <p className="mb-2 text-xs text-accent">배송 정보</p>
                        <p>받는 사람: {purchase.shipping_recipient || "미입력"}</p>
                        <p>연락처: {purchase.shipping_phone || "미입력"}</p>
                        <p>주소: {purchase.shipping_address || "미입력"}</p>
                        {purchase.tracking_number ? (
                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <span className="rounded-full border border-white/15 bg-white/10 px-3 py-2">
                              송장: {purchase.tracking_carrier} {purchase.tracking_number}
                            </span>
                            {trackingUrl ? (
                              <a
                                href={trackingUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="rounded-full border border-amber-300/60 bg-amber-300 px-4 py-2 text-sm font-black text-slate-950 shadow-lg shadow-amber-950/20 transition hover:bg-amber-200"
                              >
                                배송조회
                              </a>
                            ) : null}
                          </div>
                        ) : (
                          <p className="mt-3 text-white/55">아직 송장번호가 등록되지 않았습니다.</p>
                        )}
                      </div>
                    ) : null}
                  </div>
                  <span className="font-bold text-white">{formatWon(purchase.amount_krw)}</span>
                  <span className="font-bold text-white">{purchaseStatusLabels[purchase.status]}</span>
                  <span className="text-sm font-bold text-white/80 md:text-right">{formatDate(purchase.created_at)}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white/10 p-10 text-center text-white/70">아직 구매내역이 없습니다.</div>
        )}
      </section>
    </main>
  );
}
