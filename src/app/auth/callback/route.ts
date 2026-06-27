import { NextResponse, type NextRequest } from "next/server";
import { syncCurrentUserProfile } from "@/lib/auth";
import { normalizeNextPath } from "@/lib/routes";
import { createSupabaseServerClient, hasSupabaseEnv } from "@/lib/supabase/server";

function getRedirectOrigin(request: NextRequest, fallbackOrigin: string) {
  if (process.env.NODE_ENV === "development") {
    return fallbackOrigin;
  }

  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") ?? "https";

  if (forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`;
  }

  return fallbackOrigin;
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = normalizeNextPath(requestUrl.searchParams.get("next"));
  const redirectOrigin = getRedirectOrigin(request, requestUrl.origin);

  if (!hasSupabaseEnv()) {
    return NextResponse.redirect(`${redirectOrigin}${next}`);
  }

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        await syncCurrentUserProfile(user, supabase);
      }

      return NextResponse.redirect(`${redirectOrigin}${next}`);
    }
  }

  const loginUrl = new URL("/login", redirectOrigin);
  loginUrl.searchParams.set("next", next);
  loginUrl.searchParams.set("error", "auth");
  return NextResponse.redirect(loginUrl);
}
