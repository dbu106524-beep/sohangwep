import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatWon(value: number) {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
    maximumFractionDigits: 0,
  }).format(value);
}

export function normalizeDiscountPercent(value?: number | null) {
  if (!Number.isFinite(value ?? 0)) {
    return 0;
  }

  return Math.min(100, Math.max(0, Math.round(value ?? 0)));
}

export function getDiscountedPrice(price: number, discountPercent?: number | null) {
  const percent = normalizeDiscountPercent(discountPercent);
  return Math.max(0, Math.round(price * ((100 - percent) / 100)));
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
}

export function slugify(input: string) {
  return input
    .normalize("NFKD")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getSiteUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

export function getImageUrls(item: { image_url?: string | null; image_urls?: string[] | null }) {
  const urls = [...(item.image_urls ?? []), item.image_url].filter((url): url is string => Boolean(url));
  return Array.from(new Set(urls)).slice(0, 5);
}
