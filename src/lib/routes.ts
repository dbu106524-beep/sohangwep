const protectedPathPrefixes = ["/admin", "/profile"];

export function normalizeNextPath(value: string | null | undefined, fallback = "/profile") {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return fallback;
  }

  try {
    const url = new URL(value, "http://app.local");
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}

export function getLoginPath(nextPath: string | null | undefined, fallback = "/profile") {
  return `/login?next=${encodeURIComponent(normalizeNextPath(nextPath, fallback))}`;
}

export function isProtectedPath(pathname: string) {
  return protectedPathPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

