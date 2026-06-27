"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getSupabasePublishableKey, getSupabaseUrl, hasSupabasePublicEnv } from "@/lib/supabase/env";
import type { Database } from "@/lib/types";

let browserClient: ReturnType<typeof createBrowserClient<Database>> | null = null;

export function hasBrowserSupabaseEnv() {
  return hasSupabasePublicEnv();
}

export function createSupabaseBrowserClient() {
  if (!hasBrowserSupabaseEnv()) {
    throw new Error("Supabase environment variables are not configured.");
  }

  if (!browserClient) {
    browserClient = createBrowserClient<Database>(
      getSupabaseUrl()!,
      getSupabasePublishableKey()!,
    );
  }

  return browserClient;
}
