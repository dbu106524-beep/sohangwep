import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { getNotices, getProducts } from "@/lib/data";

export default async function AdminPage() {
  const { allowed } = await requireAdmin("/admin");
  const [notices, products] = await Promise.all([
    getNotices({ includeDrafts: true }),
    getProducts({ includeInactive: true }),
  ]);

  if (!allowed) {
    return (
      <main>
        <section className="article-view">
          <span className="eyebrow">ADMIN</span>
          <h1>접근 권한이 없습니다</h1>
          <p className="lead">관리자 Discord ID 권한이 필요합니다.</p>
        </section>
      </main>
    );
  }

  return (
    <main>
      <section className="page-hero art-hero guide-hero">
        <span className="eyebrow">ADMIN</span>
        <h1>관리자 페이지</h1>
        <p>공지사항, 업데이트, 이벤트, 상점 상품을 관리합니다.</p>
      </section>

      <section className="dashboard-grid">
        <Link href="/admin/notices" className="glass-card">
          <span className="eyebrow">POSTS</span>
          <h2>{notices.length}</h2>
          <p>공지사항, 업데이트, 이벤트 작성/수정</p>
        </Link>
        <Link href="/admin/products" className="glass-card">
          <span className="eyebrow">SHOP</span>
          <h2>{products.length}</h2>
          <p>상점 상품 등록/수정</p>
        </Link>
        <Link href="/admin/purchases" className="glass-card">
          <span className="eyebrow">ORDERS</span>
          <h2>주문</h2>
          <p>구매내역, 지급 상태, 굿즈 배송 관리</p>
        </Link>
        <Link href="/admin/legal" className="glass-card">
          <span className="eyebrow">POLICY</span>
          <h2>3</h2>
          <p>이용약관, 개인정보처리방침, 환불정책 수정</p>
        </Link>
        <div className="glass-card">
          <span className="eyebrow">PAYMENT</span>
          <h2>{process.env.PAYMENT_MODE ?? "test"}</h2>
          <p>결제 후원과 마인크래프트 지급 API 연결 준비</p>
        </div>
      </section>
    </main>
  );
}
