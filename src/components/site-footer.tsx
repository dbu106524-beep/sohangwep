import Link from "next/link";
import type { CurrentUser } from "@/lib/types";

export function SiteFooter({ user }: { user: CurrentUser | null }) {
  return (
    <footer className="site-footer">
      <div>
        <strong>소행성</strong>
        <p>따뜻한 우주 여행을 준비하는 마인크래프트 탐험 커뮤니티</p>
      </div>
      <nav className="footer-links" aria-label="하단 메뉴">
        <Link href="/terms/service">이용약관</Link>
        <Link href="/terms/privacy">개인정보처리방침</Link>
        <Link href="/terms/refund">환불정책</Link>
        <Link href={user ? "/admin" : "/login?next=%2Fadmin"}>{user?.isAdmin ? "관리자 페이지" : "관리자 로그인"}</Link>
      </nav>
    </footer>
  );
}
