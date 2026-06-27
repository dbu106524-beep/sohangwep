import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/server";

type LinkPayload = {
  action?: "link" | "update" | "unlink";
  discordId?: string;
  discordName?: string;
  minecraftUuid?: string;
  minecraftAccountName?: string;
  minecraftName?: string;
  hasCommunityRole?: boolean;
};

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: NextRequest) {
  const expectedKey = process.env.INTERNAL_DINBU_DISCORD_KEY;
  const providedKey = request.headers.get("x-internal-key");

  if (!expectedKey || providedKey !== expectedKey) {
    return unauthorized();
  }

  let payload: LinkPayload;
  try {
    payload = (await request.json()) as LinkPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const action = payload.action ?? "link";
  const discordId = clean(payload.discordId);

  if (!discordId) {
    return NextResponse.json({ error: "discordId is required" }, { status: 400 });
  }

  const supabase = await createSupabaseServiceClient();

  if (action === "unlink") {
    await supabase.from("minecraft_links").delete().eq("discord_id", discordId);
    await supabase
      .from("profiles")
      .update({
        minecraft_uuid: null,
        minecraft_account_name: null,
        minecraft_name: null,
        community_role_verified: false,
      })
      .eq("discord_id", discordId);

    return NextResponse.json({ ok: true, action });
  }

  const minecraftUuid = clean(payload.minecraftUuid);
  const minecraftAccountName = clean(payload.minecraftAccountName) || null;
  const minecraftName = clean(payload.minecraftName);

  if (!minecraftUuid || !minecraftName) {
    return NextResponse.json({ error: "minecraftUuid and minecraftName are required" }, { status: 400 });
  }

  const communityRoleVerified = Boolean(payload.hasCommunityRole);
  const discordName = clean(payload.discordName) || null;
  const now = new Date().toISOString();

  const { error: linkError } = await supabase.from("minecraft_links").upsert(
    {
      discord_id: discordId,
      discord_name: discordName,
      minecraft_uuid: minecraftUuid,
      minecraft_account_name: minecraftAccountName,
      minecraft_name: minecraftName,
      community_role_verified: communityRoleVerified,
      updated_at: now,
    },
    { onConflict: "discord_id" },
  );

  if (linkError) {
    return NextResponse.json({ error: linkError.message }, { status: 500 });
  }

  const { data: profiles, error: profileError } = await supabase
    .from("profiles")
    .update({
      minecraft_uuid: minecraftUuid,
      minecraft_account_name: minecraftAccountName,
      minecraft_name: minecraftName,
      community_role_verified: communityRoleVerified,
    })
    .eq("discord_id", discordId)
    .select("id");

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  const profileIds = (profiles ?? []).map((profile) => profile.id);
  if (profileIds.length > 0) {
    await Promise.all([
      supabase.from("community_posts").update({ author_name: minecraftName }).in("author_id", profileIds),
      supabase.from("community_comments").update({ author_name: minecraftName }).in("author_id", profileIds),
    ]);
  }

  return NextResponse.json({ ok: true, action });
}
