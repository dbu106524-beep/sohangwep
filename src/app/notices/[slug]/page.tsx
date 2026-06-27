import { notFound } from "next/navigation";
import { getNotice } from "@/lib/data";
import { noticeTypeLabels } from "@/lib/site-content";
import { formatDate } from "@/lib/utils";

export default async function NoticeDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const notice = await getNotice(slug);

  if (!notice) {
    notFound();
  }

  return (
    <main>
      <article className="article-view">
        <div className="post-topline">
          <span className="badge">{noticeTypeLabels[notice.category]}</span>
          <span>작성자 소행성</span>
          <time>{formatDate(notice.created_at)}</time>
        </div>
        <h1>{notice.title}</h1>
        <p className="lead">{notice.excerpt}</p>
        {notice.image_url ? (
          <div className="article-main-image">
            <img src={notice.image_url} alt="" />
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
