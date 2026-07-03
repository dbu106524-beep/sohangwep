import Link from "next/link";
import { shipPurchaseAction, updatePurchaseStatusAction } from "@/app/admin/actions";
import { requireAdmin } from "@/lib/auth";
import { getAdminPurchases } from "@/lib/data";
import { getTrackingUrl, purchaseStatusLabels, purchaseStatusOptions } from "@/lib/purchase-status";
import { formatDate, formatWon } from "@/lib/utils";

function minecraftName(purchase: Awaited<ReturnType<typeof getAdminPurchases>>[number]) {
  const account = purchase.profile?.minecraft_account_name?.trim();
  const display = purchase.profile?.minecraft_name?.trim();
  if (account && display && account !== display) {
    return `${account} [${display}]`;
  }

  return display || account || "미연동";
}

export default async function AdminPurchasesPage() {
  const { allowed } = await requireAdmin("/admin/purchases");
  const purchases = await getAdminPurchases();

  if (!allowed) {
    return (
      <main>
        <section className="article-view">
          <span className="eyebrow">ADMIN</span>
          <h1>접근 권한이 없습니다</h1>
          <p className="lead">관리자만 구매내역을 확인할 수 있습니다.</p>
        </section>
      </main>
    );
  }

  return (
    <main>
      <section className="page-hero art-hero shop-hero">
        <span className="eyebrow">ADMIN ORDERS</span>
        <h1>구매내역 관리</h1>
        <p>유저별 주문, 스타 크레딧 구매 신청, 지급 상태, 굿즈 배송 정보를 관리합니다.</p>
        <Link href="/admin" className="text-link">
          관리자 페이지로 돌아가기
        </Link>
      </section>

      <section className="section-shell admin-order-list">
        {purchases.length ? (
          purchases.map((purchase) => <PurchaseAdminCard key={purchase.id} purchase={purchase} />)
        ) : (
          <div className="empty-state">
            <h3>구매내역이 없습니다</h3>
            <p>주문이 생성되면 여기에 표시됩니다.</p>
          </div>
        )}
      </section>
    </main>
  );
}

function PurchaseAdminCard({ purchase }: { purchase: Awaited<ReturnType<typeof getAdminPurchases>>[number] }) {
  const trackingUrl = getTrackingUrl(purchase.tracking_carrier, purchase.tracking_number);
  const isCreditDonation = purchase.product_kind === "credit" && purchase.payment_provider === "bank_transfer";

  return (
    <article className="glass-card admin-order-card">
      <div className="post-topline">
        <span className="badge">{purchase.product_kind === "goods" ? "굿즈" : "스타 크레딧"}</span>
        <span className="order-status">{purchaseStatusLabels[purchase.status]}</span>
        <time>{formatDate(purchase.created_at)}</time>
      </div>

      <div className="admin-order-grid">
        <div>
          <h2>{purchase.product_name}</h2>
          <p className="muted">
            주문번호: <span className="font-mono">{purchase.id}</span>
          </p>
          <p className="muted">
            결제참조: <span className="font-mono">{purchase.payment_reference ?? "-"}</span>
          </p>
          <strong className="price">{formatWon(purchase.amount_krw)}</strong>
        </div>

        <div className="order-user-box">
          <strong>{purchase.profile?.display_name ?? "알 수 없는 유저"}</strong>
          <p>
            Discord ID: <span className="font-mono">{purchase.profile?.discord_id ?? "-"}</span>
          </p>
          <p>마크 닉네임: {minecraftName(purchase)}</p>
        </div>

        {isCreditDonation ? (
          <div className="order-shipping-box">
            <strong>후원 처리 정보</strong>
            <p>
              티켓 채널:{" "}
              {purchase.donation_ticket_channel_id ? (
                <span className="font-mono">{purchase.donation_ticket_channel_id}</span>
              ) : (
                "생성 대기"
              )}
            </p>
            <p>입금자명: {purchase.donation_depositor ?? "-"}</p>
            {purchase.donation_reported_at ? <p>입금요청: {formatDate(purchase.donation_reported_at)}</p> : null}
            {purchase.fulfilled_at ? <p>지급완료: {formatDate(purchase.fulfilled_at)}</p> : null}
            {purchase.donation_note ? <p>비고: {purchase.donation_note}</p> : null}
          </div>
        ) : null}

        {purchase.product_kind === "goods" ? (
          <div className="order-shipping-box">
            <strong>배송 정보</strong>
            <p>
              {purchase.shipping_recipient ?? "-"} / {purchase.shipping_phone ?? "-"}
            </p>
            <p>{purchase.shipping_address ?? "-"}</p>
            {purchase.shipping_message ? <p>메시지: {purchase.shipping_message}</p> : null}
            {purchase.tracking_number ? (
              <p>
                송장: {purchase.tracking_carrier} {purchase.tracking_number}
                {trackingUrl ? (
                  <>
                    {" "}
                    <a href={trackingUrl} target="_blank" rel="noreferrer" className="text-link">
                      배송조회
                    </a>
                  </>
                ) : null}
              </p>
            ) : null}
            {purchase.shipped_at ? <p>발송일: {formatDate(purchase.shipped_at)}</p> : null}
          </div>
        ) : null}
      </div>

      <div className="admin-order-actions">
        <form action={updatePurchaseStatusAction} className="order-inline-form">
          <input type="hidden" name="id" value={purchase.id} />
          <select name="status" className="admin-select" defaultValue={purchase.status}>
            {purchaseStatusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <button type="submit" className="button primary">
            상태 저장
          </button>
        </form>

        {purchase.product_kind === "goods" ? (
          <form action={shipPurchaseAction} className="order-inline-form order-shipping-form">
            <input type="hidden" name="id" value={purchase.id} />
            <input name="tracking_carrier" className="admin-input" defaultValue={purchase.tracking_carrier ?? ""} placeholder="택배사" />
            <input name="tracking_number" className="admin-input" defaultValue={purchase.tracking_number ?? ""} placeholder="송장번호" />
            <button type="submit" className="button primary">
              발송 처리
            </button>
          </form>
        ) : null}
      </div>
    </article>
  );
}
