import Link from "next/link";
import {
  CommunityListCard,
  CommunityTabs,
  ScreenshotCard,
  communityCategoryDescriptions,
  communityCategoryLabels,
} from "@/components/community-cards";
import { getCurrentUser } from "@/lib/auth";
import { getCommunityPosts } from "@/lib/data";
import type { CommunityCategory } from "@/lib/types";

const allowedCategories = new Set<CommunityCategory>(["screenshot", "free", "tips"]);

function parseCategory(value?: string): CommunityCategory | undefined {
  return allowedCategories.has(value as CommunityCategory) ? (value as CommunityCategory) : undefined;
}

export default async function CommunityPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const params = await searchParams;
  const activeCategory = parseCategory(params.category);
  const activeTab = activeCategory ?? "all";
  const [posts, user] = await Promise.all([getCommunityPosts(activeCategory), getCurrentUser()]);
  const screenshotPosts = posts.filter((post) => post.category === "screenshot");
  const textPosts = posts.filter((post) => post.category !== "screenshot");
  const canWrite = Boolean(user?.profile?.minecraft_name && user.profile.community_role_verified);

  return (
    <main>
      <section className="page-hero art-hero community-hero">
        <span className="eyebrow">COMMUNITY</span>
        <h1>커뮤니티</h1>
        <p>
          {activeCategory
            ? communityCategoryDescriptions[activeCategory]
            : "소행성 탐험대원이 스크린샷, 자유로운 이야기, 팁과 노하우를 함께 나누는 공간입니다."}
        </p>
        <div className="hero-buttons">
          {user ? (
            <Link href="/community/new" className={`button primary ${canWrite ? "" : "disabled-link"}`}>
              글쓰기
            </Link>
          ) : (
            <Link href="/login?next=%2Fcommunity%2Fnew" className="button primary">
              Discord 로그인 후 글쓰기
            </Link>
          )}
        </div>
        {user && !canWrite ? (
          <p className="community-write-note">글쓰기는 디스코드 역할과 마인크래프트 계정 연동이 완료된 후 사용할 수 있습니다.</p>
        ) : null}
      </section>

      <CommunityTabs active={activeTab} />

      {activeCategory === "screenshot" ? (
        <section className="screenshot-grid">
          {posts.map((post) => (
            <ScreenshotCard key={post.id} post={post} />
          ))}
        </section>
      ) : activeCategory ? (
        <section className="community-list">
          {posts.map((post) => (
            <CommunityListCard key={post.id} post={post} />
          ))}
        </section>
      ) : (
        <>
          {screenshotPosts.length ? (
            <section className="community-section">
              <div className="section-head">
                <span className="eyebrow">SCREENSHOTS</span>
                <h2>스크린샷</h2>
                <Link href="/community?category=screenshot" className="text-link">
                  더 보기
                </Link>
              </div>
              <div className="screenshot-grid">
                {screenshotPosts.slice(0, 6).map((post) => (
                  <ScreenshotCard key={post.id} post={post} />
                ))}
              </div>
            </section>
          ) : null}

          <section className="community-section">
            <div className="section-head">
              <span className="eyebrow">BOARD</span>
              <h2 className="community-board-title">
                <span>자유게시판</span>
                <span>팁과 노하우</span>
              </h2>
            </div>
            <div className="community-list">
              {textPosts.map((post) => (
                <CommunityListCard key={post.id} post={post} />
              ))}
            </div>
          </section>
        </>
      )}

      {!posts.length ? (
        <div className="empty-state">
          <h3>{activeCategory ? `${communityCategoryLabels[activeCategory]} 글이 아직 없습니다` : "커뮤니티 글이 아직 없습니다"}</h3>
          <p>첫 탐험 기록을 남겨 주세요.</p>
        </div>
      ) : null}
    </main>
  );
}
