import Link from "next/link";
import { updateLegalPageAction } from "@/app/admin/actions";
import { requireAdmin } from "@/lib/auth";
import { getLegalPages } from "@/lib/data";
import { legalPageLabels } from "@/lib/legal-content";
import { formatDate } from "@/lib/utils";

export default async function AdminLegalPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const { saved } = await searchParams;
  const { allowed } = await requireAdmin("/admin/legal");
  const pages = await getLegalPages();

  if (!allowed) {
    return (
      <main>
        <section className="article-view">
          <span className="eyebrow">ADMIN</span>
          <h1>접근 권한이 없습니다</h1>
          <p className="lead">관리자만 정책 문서를 수정할 수 있습니다.</p>
        </section>
      </main>
    );
  }

  return (
    <main>
      <section className="page-hero art-hero guide-hero">
        <span className="eyebrow">ADMIN POLICY</span>
        <h1>정책 문서 관리</h1>
        <p>이용약관, 개인정보처리방침, 환불정책을 수정합니다.</p>
        <Link href="/admin" className="text-link">
          관리자 페이지로 돌아가기
        </Link>
      </section>

      <section className="section-shell admin-legal-list">
        {saved === "1" ? (
          <div className="save-toast" role="status">
            저장 완료되었습니다.
          </div>
        ) : null}

        {pages.map((page) => (
          <form key={page.slug} action={updateLegalPageAction} className="glass-card admin-legal-form">
            <input type="hidden" name="slug" value={page.slug} />
            <div className="post-topline">
              <span className="badge">{legalPageLabels[page.slug]}</span>
              <time>최근 수정 {formatDate(page.updated_at)}</time>
            </div>
            <AdminInput name="title" label="제목" defaultValue={page.title} required />
            <AdminInput name="description" label="설명" defaultValue={page.description} required />
            <AdminTextarea name="content" label="본문" defaultValue={page.content} required />
            <div className="admin-actions">
              <button type="submit" className="button primary">
                저장
              </button>
              <Link href={`/terms/${page.slug}`} className="button ghost">
                보기
              </Link>
            </div>
          </form>
        ))}
      </section>
    </main>
  );
}

function AdminInput(props: { name: string; label: string; defaultValue?: string; required?: boolean }) {
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
      <textarea rows={12} className="admin-textarea policy-editor-textarea" {...textareaProps} />
    </label>
  );
}
