import { notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getNotice } from "@/lib/data";
import { noticeTypeLabels } from "@/lib/site-content";
import { formatDate, getImageUrls } from "@/lib/utils";

export default async function NoticeDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [notice, user] = await Promise.all([getNotice(slug), getCurrentUser()]);

  if (!notice) {
    notFound();
  }
  const imageUrls = getImageUrls(notice);

  return (
    <main>
      <article className="article-view">
        <div className="post-topline">
          <span className="badge">{noticeTypeLabels[notice.category]}</span>
          <span>작성자 소행성</span>
          <time>{formatDate(notice.created_at)}</time>
        </div>
        {user?.isAdmin ? (
          <div className="admin-actions notice-detail-actions">
            <Link href={`/admin/notices/${notice.id}`} className="button primary">
              수정
            </Link>
          </div>
        ) : null}
        <h1>{notice.title}</h1>
        <p className="lead">{notice.excerpt}</p>
        {imageUrls.length ? (
          <div className="article-image-gallery">
            {imageUrls.map((url) => (
              <img key={url} src={url} alt="" />
            ))}
          </div>
        ) : null}
        <div className="article-body">
          {notice.content.split(/\n{2,}/).map((block) => (
            <p key={block}>{block}</p>
          ))}
        </div>
      </article>
    </main>
  );
}
