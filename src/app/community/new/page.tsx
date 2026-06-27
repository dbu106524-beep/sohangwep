import Link from "next/link";
import { CommunityForm } from "@/components/community-form";
import { requireCurrentUser } from "@/lib/auth";

export default async function NewCommunityPostPage() {
  const user = await requireCurrentUser("/community/new");
  const canWrite = Boolean(user.profile?.minecraft_name && user.profile.community_role_verified);

  return (
    <main>
      <section className="page-hero">
        <span className="eyebrow">NEW POST</span>
        <h1>커뮤니티 글쓰기</h1>
        <p>스크린샷, 자유게시판, 팁과 노하우 중 알맞은 게시판을 선택해 탐험 기록을 남겨 주세요.</p>
        <Link href="/community" className="text-link">
          커뮤니티로 돌아가기
        </Link>
      </section>
      {canWrite ? (
        <CommunityForm />
      ) : (
        <div className="empty-state">
          <h3>글쓰기 권한이 아직 없습니다</h3>
          <p>소행성 디스코드 역할과 마인크래프트 계정 연동이 완료되면 글을 작성할 수 있습니다.</p>
        </div>
      )}
    </main>
  );
}
