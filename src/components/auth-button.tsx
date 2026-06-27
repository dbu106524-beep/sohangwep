"use client";

import Link from "next/link";
import { useState } from "react";
import { normalizeNextPath } from "@/lib/routes";
import type { CurrentUser } from "@/lib/types";
import { createSupabaseBrowserClient, hasBrowserSupabaseEnv } from "@/lib/supabase/browser";

export function AuthButton({ user, nextPath = "/profile" }: { user: CurrentUser | null; nextPath?: string }) {
  const [pending, setPending] = useState(false);

  async function signIn() {
    if (!hasBrowserSupabaseEnv()) {
      alert("Supabase 환경변수를 설정하면 Discord 로그인을 사용할 수 있어요.");
      return;
    }

    setPending(true);
    const supabase = createSupabaseBrowserClient();
    const next = normalizeNextPath(nextPath);
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
    await supabase.auth.signInWithOAuth({
      provider: "discord",
      options: { redirectTo },
    });
  }

  async function signOut() {
    if (!hasBrowserSupabaseEnv()) {
      return;
    }

    setPending(true);
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  if (user) {
    return (
      <div className="flex items-center gap-2">
        <Link href="/profile" className="planet-button bg-white text-sm text-[#2d235d]">
          내 프로필
        </Link>
        <button
          type="button"
          onClick={signOut}
          disabled={pending}
          className="planet-button border border-[#5c4aa8]/20 bg-transparent text-sm text-[#5c4aa8]"
        >
          로그아웃
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={signIn}
      disabled={pending}
      className="planet-button bg-[#2d235d] text-sm text-white max-sm:mr-4 max-sm:size-10 max-sm:p-0"
    >
      <span className="sm:hidden">D</span>
      <span className="hidden sm:inline">Discord&nbsp;로그인</span>
    </button>
  );
}
