"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { getDiscordInviteUrl, siteNavItems } from "@/lib/site-content";
import type { CurrentUser } from "@/lib/types";
import { createSupabaseBrowserClient, hasBrowserSupabaseEnv } from "@/lib/supabase/browser";

export function SiteNav({ user }: { user: CurrentUser | null }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  async function signOut() {
    if (!hasBrowserSupabaseEnv()) {
      return;
    }

    setPending(true);
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  return (
    <>
      <button type="button" className="nav-toggle" onClick={() => setOpen((value) => !value)} aria-expanded={open}>
        메뉴
      </button>
      <nav className={`main-nav ${open ? "is-open" : ""}`} aria-label="주요 메뉴">
        {siteNavItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={pathname === item.href || pathname.startsWith(`${item.href}/`) ? "active" : undefined}
            onClick={() => setOpen(false)}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="header-actions">
        {user ? (
          <>
            <Link className="button ghost user-chip" href="/profile">
              {user.avatarUrl ? <img src={user.avatarUrl} alt="" /> : null}
              <span>{user.name}</span>
            </Link>
            <button type="button" className="button ghost" onClick={signOut} disabled={pending}>
              {pending ? "..." : "로그아웃"}
            </button>
          </>
        ) : (
          <Link className="button ghost" href="/login?next=%2Fcommunity" onClick={() => setOpen(false)}>
            로그인
          </Link>
        )}
        <a className="button primary" href={getDiscordInviteUrl()} target="_blank" rel="noreferrer">
          디스코드
        </a>
      </div>
    </>
  );
}
