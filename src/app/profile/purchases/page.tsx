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
      <PageHero eyebrow="History" title="구매 내역" description="테스트 결제와 실제 결제 연동 후 내역이 표시됩니다." />
      <section className="section-shell glass-card overflow-hidden rounded-3xl purchase-history">
        <div className="grid gap-px bg-white/10">
          {history.map((purchase) => (
            <div key={purchase.id} className="grid gap-3 bg-white/10 p-5 text-white md:grid-cols-4 md:items-center">
              <div>
                <strong className="text-white">{purchase.product_name}</strong>
                {purchase.product_kind === "goods" ? (
                  <p className="mt-2 text-sm font-bold text-white/75">
                    {purchase.shipping_recipient} / {purchase.shipping_phone}
                    <br />
                    {purchase.shipping_address}
                    {purchase.tracking_number ? (
                      <>
                        <br />
                        송장: {purchase.tracking_carrier} {purchase.tracking_number}
                        {getTrackingUrl(purchase.tracking_carrier, purchase.tracking_number) ? (
                          <>
                            {" "}
                            <a
                              href={getTrackingUrl(purchase.tracking_carrier, purchase.tracking_number) ?? undefined}
                              target="_blank"
                              rel="noreferrer"
                              className="text-link"
                            >
                              배송조회
                            </a>
                          </>
                        ) : null}
                      </>
                    ) : null}
                  </p>
                ) : null}
              </div>
              <span className="font-bold text-white">{formatWon(purchase.amount_krw)}</span>
              <span className="font-bold text-white">{purchaseStatusLabels[purchase.status]}</span>
              <span className="text-sm font-bold text-white/80 md:text-right">{formatDate(purchase.created_at)}</span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
