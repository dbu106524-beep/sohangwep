"use client";

import Link from "next/link";
import { useState } from "react";
import { normalizeNextPath } from "@/lib/routes";
import { createSupabaseBrowserClient, hasBrowserSupabaseEnv } from "@/lib/supabase/browser";

export function LoginPanel({ nextPath, hasError }: { nextPath: string; hasError: boolean }) {
  const [pending, setPending] = useState(false);
  const safeNextPath = normalizeNextPath(nextPath);
  const canUseSupabase = hasBrowserSupabaseEnv();

  async function signIn() {
    if (!canUseSupabase) {
      return;
    }

    setPending(true);
    const supabase = createSupabaseBrowserClient();
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(safeNextPath)}`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "discord",
      options: { redirectTo },
    });

    if (error) {
      setPending(false);
    }
  }

  return (
    <section className="admin-card">
        <p className="eyebrow">DISCORD ACCESS</p>
        <h1>Discord 로그인</h1>
        <p className="lead">
          커뮤니티 글쓰기와 이미지 업로드는 Discord 로그인 후 사용할 수 있습니다. 관리자 계정은 같은 로그인으로 자동 판별됩니다.
        </p>
          {hasError ? (
            <p className="admin-warning">
              로그인 연결이 완료되지 않았습니다. Discord 인증을 다시 시도해 주세요.
            </p>
          ) : null}
          {!canUseSupabase ? (
            <p className="admin-warning">
              Supabase 환경변수를 설정하면 Discord 로그인을 사용할 수 있습니다.
            </p>
          ) : null}
          <button
            type="button"
            onClick={signIn}
            disabled={pending || !canUseSupabase}
            className="button primary"
          >
            {pending ? "연결 중..." : "Discord로 로그인"}
          </button>
          <Link href="/" className="text-link">
            홈으로 돌아가기
          </Link>
    </section>
  );
}
