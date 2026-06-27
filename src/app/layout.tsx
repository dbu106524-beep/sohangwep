import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AdRails } from "@/components/ad-rails";
import { BodyPageMarker } from "@/components/body-page-marker";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { SpaceEffects } from "@/components/space-effects";
import { getCurrentUser } from "@/lib/auth";
import { SpeedInsights } from "@vercel/speed-insights/next";

export const metadata: Metadata = {
  title: {
    default: "소행성 | 마인크래프트 우주 탐험",
    template: "%s | 소행성",
  },
  description: "소행성 공지사항, 업데이트, 커뮤니티, 상점, 디스코드 참여 안내",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icon-192.png",
    apple: "/icon-192.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#030917",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();

  return (
    <html lang="ko">
      <body>
        <BodyPageMarker />
        <SpaceEffects />
        <AdRails />
        <SiteHeader user={user} />
        {children}
        <SiteFooter user={user} />
        <SpeedInsights />
      </body>
    </html>
  );
}
