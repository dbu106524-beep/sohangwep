import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteNoticeAction, updateNoticeAction } from "@/app/admin/actions";
import { requireAdmin } from "@/lib/auth";
import { getNotices } from "@/lib/data";
import { noticeTypeLabels } from "@/lib/site-content";
import type { Notice } from "@/lib/types";
import { formatDate, getImageUrls } from "@/lib/utils";

export default async function AdminNoticeEditPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const { id } = await params;
  const { saved } = await searchParams;
  const { allowed } = await requireAdmin(`/admin/notices/${id}`);
  const notices = await getNotices({ includeDrafts: true });
  const notice = notices.find((item) => item.id === id);

  if (!allowed) {
    return (
      <main>
        <section className="article-view">
          <span className="eyebrow">ADMIN</span>
          <h1>접근 권한이 없습니다</h1>
          <p className="lead">관리자만 게시글을 수정할 수 있습니다.</p>
        </section>
      </main>
    );
  }

  if (!notice) {
    notFound();
  }
  const imageUrls = getImageUrls(notice);

  return (
    <main>
      <section className="page-hero art-hero notice-hero">
        <span className="eyebrow">ADMIN EDIT</span>
        <h1>게시글 수정</h1>
        <p>{noticeTypeLabels[notice.category]} 글의 내용과 공개 상태를 수정합니다.</p>
        <Link href="/admin/notices" className="text-link">
          게시글 관리로 돌아가기
        </Link>
      </section>

      <section className="section-shell glass-card admin-edit-panel">
        {saved === "1" ? (
          <div className="save-toast" role="status">
            수정 완료됐습니다.
          </div>
        ) : null}
        <div className="post-topline">
          <span className="badge">{noticeTypeLabels[notice.category]}</span>
          <span>{notice.published ? "공개" : "비공개"}</span>
          <time>{formatDate(notice.created_at)}</time>
        </div>

        <form action={updateNoticeAction}>
          <input type="hidden" name="id" value={notice.id} />
          <input type="hidden" name="current_slug" value={notice.slug} />
          {notice.image_url ? <input type="hidden" name="current_image_url" value={notice.image_url} /> : null}
          <input type="hidden" name="current_image_urls" value={JSON.stringify(imageUrls)} />
          <AdminInput name="title" label="제목" defaultValue={notice.title} required />
          <AdminInput name="excerpt" label="요약" defaultValue={notice.excerpt} required />
          <AdminTextarea name="content" label="본문" defaultValue={notice.content} required />
          <AdminSelect name="category" label="분류" defaultValue={notice.category} />
          <AdminInput name="image_url" label="이미지 URL 또는 Storage URL" defaultValue={notice.image_url ?? ""} />
          <label className="admin-field">
            <span>이미지 파일 업로드</span>
            <input className="file-input" name="image_files" type="file" accept="image/png,image/jpeg,image/webp,image/gif" multiple />
            <small className="field-help">최대 5장까지 업로드할 수 있습니다. 새 이미지를 선택하면 기존 이미지를 대체합니다.</small>
          </label>
          {imageUrls.length ? (
            <div className="admin-image-grid">
              {imageUrls.map((url) => (
                <img key={url} src={url} alt="" />
              ))}
            </div>
          ) : null}
          <label className="checkbox-row">
            <input name="published" type="checkbox" defaultChecked={notice.published} /> 공개
          </label>
          <div className="admin-actions">
            <button className="button primary">수정 완료</button>
            <button formAction={deleteNoticeAction} className="button danger">
              삭제
            </button>
            <Link href={`/notices/${encodeURIComponent(notice.slug || notice.id)}`} className="button ghost">
              글 보기
            </Link>
          </div>
        </form>
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
      <textarea rows={10} className="admin-textarea" {...textareaProps} />
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
