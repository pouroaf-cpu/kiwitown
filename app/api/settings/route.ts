export const preferredRegion = "syd1";

import { NextResponse } from "next/server";
import { getViewer, hasRole } from "@/lib/authorization";

export async function GET() {
  const { supabase, user } = await getViewer();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data, error } = await supabase.from("system_settings").select("*").eq("archived", false).limit(1).single();
  return error ? NextResponse.json({ error: error.message }, { status: 500 }) : NextResponse.json(data);
}

export async function PATCH(request: Request) {
  const { supabase, user, profile } = await getViewer();
  if (!user || !hasRole(profile, ["super_admin"])) return NextResponse.json({ error: "Only system owner can update branding" }, { status: 403 });
  const body = await request.json() as { id?: string; business_name?: string; logo_url?: string | null; brand_colour?: string; default_bonus_pct?: number };
  if (!body.id) return NextResponse.json({ error: "Missing settings id" }, { status: 400 });
  const { id, ...updates } = body;
  const { data, error } = await supabase.from("system_settings").update(updates).eq("id", id).select().single();
  return error ? NextResponse.json({ error: error.message }, { status: 500 }) : NextResponse.json(data);
}
