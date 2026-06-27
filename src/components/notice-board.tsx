import { NoticeCard } from "@/components/cards";
import { noticeTypeLabels } from "@/lib/site-content";
import type { Notice } from "@/lib/types";

const heroClass: Record<Notice["category"], string> = {
  notice: "notice-hero",
  update: "update-hero",
  event: "event-hero",
};

export function NoticeBoard({ type, notices }: { type: Notice["category"]; notices: Notice[] }) {
  const label = noticeTypeLabels[type];
  const filtered = notices.filter((notice) => notice.category === type);

  return (
    <main>
      <section className={`page-hero art-hero ${heroClass[type]}`}>
        <span className="eyebrow">{type.toUpperCase()}</span>
        <h1>{label}</h1>
        <p>{label} 게시글은 관리자 화면에서 작성, 수정, 공개/비공개 전환할 수 있습니다.</p>
      </section>

      <section className="toolbar glass-card">
        <span>{filtered.length}개 신호 수신</span>
      </section>

      {filtered.length ? (
        <section className="post-grid">
          {filtered.map((notice) => (
            <NoticeCard key={notice.id} notice={notice} />
          ))}
        </section>
      ) : (
        <div className="empty-state">
          <h3>게시글이 없습니다</h3>
          <p>관리자 화면에서 {label} 게시글을 추가하면 이곳에 표시됩니다.</p>
        </div>
      )}
    </main>
  );
}
