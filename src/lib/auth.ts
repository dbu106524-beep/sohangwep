import type { User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { mockProfile } from "@/lib/mock-data";
import { getLoginPath } from "@/lib/routes";
import { createSupabaseServerClient, createSupabaseServiceClient, hasSupabaseEnv } from "@/lib/supabase/server";
import type { CurrentUser, Profile } from "@/lib/types";

type SupabaseServerClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;
type SupabaseClient = SupabaseServerClient;

function getAdminDiscordIds() {
  const [ownerDiscordId] = (process.env.ADMIN_DISCORD_IDS || "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);

  return ownerDiscordId ? [ownerDiscordId] : [];
}

function getMetadataString(user: User, keys: string[]) {
  const metadata = (user.user_metadata ?? {}) as Record<string, unknown>;

  for (const key of keys) {
    const value = metadata[key];

    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }

  return null;
}

function getDiscordIdFromUser(user: User | null) {
  if (!user) {
    return null;
  }

  const discordIdentity = user.identities?.find((identity) => identity.provider === "discord");
  const discordId = discordIdentity?.identity_data?.id;

  return typeof discordId === "string" ? discordId : null;
}

function getDisplayName(user: User, profile: Profile | null) {
  return (
    profile?.display_name ||
    getMetadataString(user, ["full_name", "name", "preferred_username", "user_name"]) ||
    "소행성 탐험가"
  );
}

function getAvatarUrl(user: User, profile: Profile | null) {
  return profile?.avatar_url || getMetadataString(user, ["avatar_url", "picture"]);
}

async function getMinecraftLinkByDiscordId(supabase: SupabaseClient, discordId: string) {
  const { data, error } = await supabase
    .from("minecraft_links")
    .select("minecraft_uuid,minecraft_account_name,minecraft_name,community_role_verified")
    .eq("discord_id", discordId)
    .maybeSingle();

  if (error) {
    console.warn("[Supabase fallback] syncMinecraftLink:", error.message);
    return null;
  }

  return data;
}

async function upsertProfileFromUser(user: User, discordId: string | null, supabase: SupabaseClient) {
  const payload = {
    id: user.id,
    discord_id: discordId,
    display_name: getDisplayName(user, null),
    avatar_url: getAvatarUrl(user, null),
  };

  const { error } = await supabase.from("profiles").upsert(payload, { onConflict: "id" });

  if (error) {
    console.warn("[Supabase fallback] syncCurrentUserProfile:", error.message);
  }
}

async function syncProfileMinecraftLink(user: User, discordId: string | null, profile: Profile | null) {
  if (!discordId) {
    return profile;
  }

  const serviceSupabase = await createSupabaseServiceClient().catch(() => null);
  if (!serviceSupabase) {
    return profile;
  }

  await upsertProfileFromUser(user, discordId, serviceSupabase);

  const link = await getMinecraftLinkByDiscordId(serviceSupabase, discordId);
  if (!link) {
    const { data: freshProfile } = await serviceSupabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
    return freshProfile ?? profile;
  }

  const patch = {
    minecraft_uuid: link.minecraft_uuid,
    minecraft_account_name: link.minecraft_account_name,
    minecraft_name: link.minecraft_name,
    community_role_verified: link.community_role_verified,
  };

  const { data: updatedProfile, error: updateError } = await serviceSupabase
    .from("profiles")
    .update(patch)
    .eq("id", user.id)
    .select("*")
    .maybeSingle();

  if (updateError) {
    console.warn("[Supabase fallback] updateMinecraftProfile:", updateError.message);
    return profile ? { ...profile, ...patch } : profile;
  }

  return updatedProfile ?? (profile ? { ...profile, ...patch } : profile);
}

export async function syncCurrentUserProfile(user: User, supabaseClient?: SupabaseServerClient) {
  if (!hasSupabaseEnv()) {
    return;
  }

  const discordId = getDiscordIdFromUser(user) ?? getMetadataString(user, ["provider_id", "sub", "discord_id"]);
  const serviceSupabase = await createSupabaseServiceClient().catch(() => null);
  const supabase = serviceSupabase ?? supabaseClient ?? (await createSupabaseServerClient());

  await upsertProfileFromUser(user, discordId, supabase);

  if (!discordId) {
    return;
  }

  await syncProfileMinecraftLink(user, discordId, null);
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  if (!hasSupabaseEnv()) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const { data: claimsData } = await supabase.auth.getClaims();

  if (!claimsData?.claims) {
    return null;
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  let { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  const discordId =
    getDiscordIdFromUser(user) ?? profile?.discord_id ?? getMetadataString(user, ["provider_id", "sub", "discord_id"]);

  profile = await syncProfileMinecraftLink(user, discordId, profile);

  const displayName = getDisplayName(user, profile);
  const avatarUrl = getAvatarUrl(user, profile);

  return {
    id: user.id,
    email: user.email,
    discordId,
    name: displayName,
    avatarUrl,
    profile,
    isAdmin: isAdminProfile(discordId),
  };
}

export async function getDemoUser(): Promise<CurrentUser> {
  return {
    id: mockProfile.id,
    discordId: mockProfile.discord_id,
    name: mockProfile.display_name,
    avatarUrl: mockProfile.avatar_url,
    profile: mockProfile,
    isAdmin: true,
  };
}

export function isAdminProfile(discordId: string | null) {
  return Boolean(discordId && getAdminDiscordIds().includes(discordId));
}

export async function requireCurrentUser(nextPath = "/profile") {
  if (!hasSupabaseEnv()) {
    return getDemoUser();
  }

  const user = await getCurrentUser();

  if (!user) {
    redirect(getLoginPath(nextPath));
  }

  return user;
}

export async function requireAdmin(nextPath = "/admin") {
  if (!hasSupabaseEnv()) {
    return { user: await getDemoUser(), allowed: true };
  }

  const user = await getCurrentUser();

  if (!user) {
    redirect(getLoginPath(nextPath));
  }

  if (!user.isAdmin) {
    return { user, allowed: false };
  }

  return { user, allowed: true };
}
