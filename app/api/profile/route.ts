export const preferredRegion = "syd1";

import { NextResponse } from "next/server";
import { getViewer } from "@/lib/authorization";
import { createAdminClient } from "@/lib/supabase/admin";

// Self-service update of the signed-in user's OWN profile (name, nickname,
// avatar). Uses the admin client after verifying ownership via the session, so
// every role can edit their own profile (RLS only lets managers update rows).
// Role / salary / archive are intentionally NOT editable here.
export async function PATCH(request: Request) {
  const { user, profile } = await getViewer();
  if (!user || !profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as {
    name?: unknown;
    nickname?: unknown;
    avatar_url?: unknown;
  };

  const patch: Record<string, string | null> = {};
  if (typeof body.name === "string" && body.name.trim()) patch.name = body.name.trim().slice(0, 120);
  if (typeof body.nickname === "string") patch.nickname = body.nickname.trim().slice(0, 60) || null;
  if (typeof body.avatar_url === "string") patch.avatar_url = body.avatar_url.trim().slice(0, 600) || null;

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .update(patch)
    .eq("id", profile.id)
    .select("id, name, nickname, avatar_url, phone, email, role")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
