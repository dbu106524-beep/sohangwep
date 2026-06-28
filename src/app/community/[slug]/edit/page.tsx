import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CommunityForm } from "@/components/community-form";
import { requireCurrentUser } from "@/lib/auth";
import { getCommunityPost } from "@/lib/data";

export default async function EditCommunityPostPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const { slug } = await params;
  const { saved } = await searchParams;
  const [post, user] = await Promise.all([getCommunityPost(slug), requireCurrentUser(`/community/${slug}/edit`)]);

  if (!post) {
    notFound();
  }

  if (post.author_id !== user.id && !user.isAdmin) {
    redirect(`/community/${slug}`);
  }

  return (
    <main>
      <section className="page-hero">
        <span className="eyebrow">EDIT POST</span>
        <h1>글 수정</h1>
        <p>작성한 커뮤니티 글의 내용과 이미지를 수정할 수 있습니다.</p>
        <Link href={`/community/${post.slug}`} className="text-link">
          글로 돌아가기
        </Link>
      </section>
      {saved === "1" ? (
        <div className="section-shell save-toast" role="status">
          수정 완료됐습니다.
        </div>
      ) : null}
      <CommunityForm post={post} />
    </main>
  );
}
