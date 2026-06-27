import { NoticeCard } from "@/components/cards";
import { noticeTypeLabels } from "@/lib/site-content";
import type { Notice } from "@/lib/types";

const heroClass: Record<Notice["category"], string> = {
  notice: "notice-hero",
  update: "update-hero",
  event: "event-hero",
};

const heroDescriptions: Record<Notice["category"], string> = {
  notice: "소행성 서버의 중요한 안내와 운영 소식을 확인해 주세요.",
  update: "새로 추가된 콘텐츠와 변경된 점을 한눈에 살펴볼 수 있어요.",
  event: "진행 중이거나 예정된 이벤트 소식을 모아두었어요.",
};

const emptyDescriptions: Record<Notice["category"], string> = {
  notice: "아직 등록된 공지사항이 없습니다. 새로운 안내가 올라오면 이곳에서 확인할 수 있어요.",
  update: "아직 등록된 업데이트가 없습니다. 새로운 변화가 생기면 이곳에 정리됩니다.",
  event: "아직 등록된 이벤트가 없습니다. 새로운 이벤트가 준비되면 이곳에 안내됩니다.",
};

export function NoticeBoard({ type, notices }: { type: Notice["category"]; notices: Notice[] }) {
  const label = noticeTypeLabels[type];
  const filtered = notices.filter((notice) => notice.category === type);

  return (
    <main>
      <section className={`page-hero art-hero ${heroClass[type]}`}>
        <span className="eyebrow">{type.toUpperCase()}</span>
        <h1>{label}</h1>
        <p>{heroDescriptions[type]}</p>
      </section>

      <section className="toolbar glass-card">
        <span>{filtered.length}개의 소식</span>
      </section>

      {filtered.length ? (
        <section className="post-grid">
          {filtered.map((notice) => (
            <NoticeCard key={notice.id} notice={notice} />
          ))}
        </section>
      ) : (
        <div className="empty-state">
          <h3>{label}이 아직 없습니다</h3>
          <p>{emptyDescriptions[type]}</p>
        </div>
      )}
    </main>
  );
}
