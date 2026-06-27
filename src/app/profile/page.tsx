import Link from "next/link";
import { PageHero } from "@/components/page-hero";
import { requireCurrentUser } from "@/lib/auth";
import { getPurchases } from "@/lib/data";
import { formatDate, formatWon } from "@/lib/utils";

export default async function ProfilePage() {
  const user = await requireCurrentUser("/profile");
  const history = await getPurchases(user.id);
  const minecraftAccountName = user.profile?.minecraft_account_name?.trim();
  const minecraftDisplayName = user.profile?.minecraft_name?.trim();
  const minecraftProfileName =
    minecraftAccountName && minecraftDisplayName && minecraftAccountName !== minecraftDisplayName
      ? `${minecraftAccountName} [${minecraftDisplayName}]`
      : minecraftDisplayName || minecraftAccountName || "미연동";

  return (
    <main>
      <PageHero
        eyebrow="My orbit"
        title={`${user.name}의 프로필`}
        description="Discord 로그인 상태, 스타 크레딧, 마인크래프트 닉네임, 구매 내역을 확인하는 공간입니다."
      />

      <section className="section-shell grid gap-6 md:grid-cols-[0.8fr_1.2fr]">
        <aside className="glass-card rounded-3xl p-7 profile-panel-readable">
          <p className="text-sm font-black text-white">스타 크레딧</p>
          <p className="mt-2 text-4xl font-black text-white">
            {(user.profile?.cash_balance ?? 0).toLocaleString("ko-KR")}
          </p>
          <p className="mt-1 text-sm font-bold text-white/80">보유 스타 크레딧</p>

          <div className="mt-6 rounded-3xl bg-white/10 p-5 text-sm leading-7 text-white">
            마인크래프트 닉네임: <strong>{minecraftProfileName}</strong>
            <br />
            Discord ID: <span className="font-mono">{user.discordId ?? "로그인 정보 없음"}</span>
          </div>

          <Link href="/shop" className="planet-button mt-6 w-full bg-[#ffd36e] text-[#2d235d]">
            상점으로
          </Link>
        </aside>

        <div className="glass-card rounded-3xl p-7 profile-panel-readable">
          <div className="mb-5 flex items-center justify-between gap-4">
            <h2 className="text-2xl font-black text-white">구매 내역</h2>
            <Link href="/profile/purchases" className="text-sm font-black text-white">
              전체보기
            </Link>
          </div>

          <div className="grid gap-3">
            {history.map((purchase) => (
              <div key={purchase.id} className="rounded-3xl bg-white/10 p-5 text-white">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-black text-white">{purchase.product_name}</p>
                    <p className="mt-1 text-xs font-bold text-white/70">{formatDate(purchase.created_at)}</p>
                  </div>
                  <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-black text-white">
                    {purchase.status}
                  </span>
                </div>
                <p className="mt-3 text-sm font-black text-white">{formatWon(purchase.amount_krw)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
