import Link from "next/link";
import { getNoticeHref, NoticeCard } from "@/components/cards";
import { getNotices } from "@/lib/data";
import { getDiscordInviteUrl, noticeTypeLabels, noticeTypePaths, siteSettings, sortNotices } from "@/lib/site-content";

function latestPanel(type: "notice" | "update" | "event", notices: Awaited<ReturnType<typeof getNotices>>) {
  const list = notices.filter((notice) => notice.category === type).slice(0, 3);

  return (
    <section className="latest-panel">
      <div className="panel-title">
        <h3>{noticeTypeLabels[type]}</h3>
        <Link href={noticeTypePaths[type]}>전체보기</Link>
      </div>
      {list.length ? (
        list.map((notice) => <NoticeCard key={notice.id} notice={notice} />)
      ) : (
        <div className="empty-state">
          <h3>신호 없음</h3>
          <p>{noticeTypeLabels[type]} 게시글이 없습니다.</p>
        </div>
      )}
    </section>
  );
}

export default async function HomePage() {
  const notices = (await getNotices()).sort(sortNotices);
  const latest = notices[0];

  return (
    <main className="home-page-main">
      <section className="home-hero">
        <div className="hero-content">
          <div className="hero-kicker">{siteSettings.tagline}</div>
          <h1>
            {siteSettings.heroTitle.split("\n").map((line) => (
              <span key={line}>
                {line}
                <br />
              </span>
            ))}
          </h1>
          <p>{siteSettings.heroSubtitle}</p>
          <div className="button-row hero-buttons single">
            <a className="button primary hero-cta" href={getDiscordInviteUrl()} target="_blank" rel="noreferrer">
              <span className="button-icon">S</span>
              소행성 디스코드 참여하기
            </a>
          </div>
        </div>

        {latest ? (
          <Link className="hero-news-strip" href={getNoticeHref(latest)}>
            <span>NEW</span>
            {latest.title}
            <strong>자세히 보기</strong>
          </Link>
        ) : null}
      </section>

      <section className="section-head home-section-head">
        <span className="eyebrow">RECENT SIGNALS</span>
        <h2>최신 소식</h2>
        <p>공지사항, 업데이트, 이벤트가 최근순으로 정리됩니다.</p>
      </section>

      <div className="dashboard-grid home-dashboard">
        {latestPanel("notice", notices)}
        {latestPanel("update", notices)}
        {latestPanel("event", notices)}
      </div>
    </main>
  );
}
