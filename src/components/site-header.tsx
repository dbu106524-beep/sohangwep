import Image from "next/image";
import Link from "next/link";
import { SiteNav } from "@/components/site-nav";
import { siteSettings } from "@/lib/site-content";
import type { CurrentUser } from "@/lib/types";

export function SiteHeader({ user }: { user: CurrentUser | null }) {
  return (
    <header className="site-header">
      <Link href="/" className="brand" aria-label="소행성 홈">
        <span className="brand-mark">
          <Image src="/icon-192.png" width={50} height={50} alt="" priority />
        </span>
        <span>
          <strong>{siteSettings.siteName}</strong>
          <small>{siteSettings.tagline}</small>
        </span>
      </Link>
      <SiteNav user={user} />
    </header>
  );
}
