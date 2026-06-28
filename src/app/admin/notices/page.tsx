import Link from "next/link";
import { createNoticeAction, deleteNoticeAction } from "@/app/admin/actions";
import { requireAdmin } from "@/lib/auth";
import { getNotices } from "@/lib/data";
import { noticeTypeLabels } from "@/lib/site-content";
import type { Notice } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export default async function AdminNoticesPage() {
  const { allowed } = await requireAdmin("/admin/notices");
  const notices = await getNotices({ includeDrafts: true });

  if (!allowed) {
    return (
      <main>
        <section className="article-view">
          <span className="eyebrow">ADMIN</span>
          <h1>접근 권한이 없습니다</h1>
          <p className="lead">관리자만 게시글을 관리할 수 있습니다.</p>
        </section>
      </main>
    );
  }

  return (
    <main>
      <section className="page-hero art-hero notice-hero">
        <span className="eyebrow">ADMIN POSTS</span>
        <h1>게시글 관리</h1>
        <p>공지사항, 업데이트, 이벤트를 작성하고 공개 상태를 관리합니다.</p>
      </section>

      <section className="split-section">
        <form action={createNoticeAction} className="glass-card" encType="multipart/form-data">
          <h2>새 글 작성</h2>
          <AdminInput name="title" label="제목" required />
          <AdminInput name="excerpt" label="요약" required />
          <AdminTextarea name="content" label="본문" required />
          <AdminSelect name="category" label="분류" />
          <AdminInput name="image_url" label="이미지 URL 또는 Storage URL" />
          <label className="admin-field">
            <span>이미지 파일 업로드</span>
            <input className="file-input" name="image_files" type="file" accept="image/png,image/jpeg,image/webp,image/gif" multiple />
            <small className="field-help">최대 5장까지 업로드할 수 있습니다.</small>
          </label>
          <label className="checkbox-row">
            <input name="published" type="checkbox" defaultChecked /> 공개
          </label>
          <button className="button primary">작성</button>
        </form>

        <div className="admin-list">
          {notices.map((notice) => (
            <article key={notice.id} className="glass-card admin-notice-row">
              <div className="post-topline">
                <span className="badge">{noticeTypeLabels[notice.category]}</span>
                <span>{notice.published ? "공개" : "비공개"}</span>
                <time>{formatDate(notice.created_at)}</time>
              </div>
              <h3>{notice.title}</h3>
              <p>{notice.excerpt}</p>
              <div className="admin-actions">
                <Link href={`/admin/notices/${notice.id}`} className="button primary">
                  수정
                </Link>
                <form action={deleteNoticeAction}>
                  <input type="hidden" name="id" value={notice.id} />
                  <button className="button danger">삭제</button>
                </form>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

function AdminInput(props: { name: string; label: string; defaultValue?: string; required?: boolean; type?: string }) {
  const { label, ...inputProps } = props;
  return (
    <label className="admin-field">
      <span>{label}</span>
      <input className="admin-input" {...inputProps} />
    </label>
  );
}

function AdminTextarea(props: { name: string; label: string; defaultValue?: string; required?: boolean }) {
  const { label, ...textareaProps } = props;
  return (
    <label className="admin-field">
      <span>{label}</span>
      <textarea rows={7} className="admin-textarea" {...textareaProps} />
    </label>
  );
}

function AdminSelect(props: { name: string; label: string; defaultValue?: Notice["category"] }) {
  const { label, ...selectProps } = props;
  return (
    <label className="admin-field">
      <span>{label}</span>
      <select className="admin-select" {...selectProps}>
        <option value="notice">공지사항</option>
        <option value="update">업데이트</option>
        <option value="event">이벤트</option>
      </select>
    </label>
  );
}
