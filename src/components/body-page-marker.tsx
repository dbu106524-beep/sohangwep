"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

function pageName(pathname: string) {
  if (pathname === "/") return "home";
  if (pathname.startsWith("/notices")) return "notice";
  if (pathname.startsWith("/updates")) return "update";
  if (pathname.startsWith("/events")) return "event";
  if (pathname.startsWith("/guide")) return "about";
  if (pathname.startsWith("/shop")) return "shop";
  if (pathname.startsWith("/login") || pathname.startsWith("/admin")) return "auth";
  return "page";
}

export function BodyPageMarker() {
  const pathname = usePathname();

  useEffect(() => {
    document.body.dataset.page = pageName(pathname);
    return () => {
      delete document.body.dataset.page;
    };
  }, [pathname]);

  return null;
}
