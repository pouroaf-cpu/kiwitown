export const preferredRegion = "syd1";

import { NextResponse } from "next/server";
import { getViewer, hasRole } from "@/lib/authorization";

export async function POST(request: Request) {
  const { supabase, user, profile } = await getViewer();
  if (!user || !profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasRole(profile, ["foreman"])) return NextResponse.json({ error: "Only foremen can submit weekly check-ins" }, { status: 403 });
  const body = await request.json() as { week_number?: number; year?: number; checklist?: Record<string, boolean>; notes?: Record<string, string> };
  if (!body.week_number || !body.year || !body.checklist || !body.notes) return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  const { data, error } = await supabase.from("weekly_submissions").upsert({
    foreman_id: profile.id,
    week_number: body.week_number,
    year: body.year,
    checklist: body.checklist,
    notes: body.notes,
    submitted_at: new Date().toISOString(),
    archived: false,
  }, { onConflict: "foreman_id,week_number,year" }).select().single();
  return error ? NextResponse.json({ error: error.message }, { status: 500 }) : NextResponse.json(data);
}

export async function GET() {
  const { supabase, user, profile } = await getViewer();
  if (!user || !profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let query = supabase.from("weekly_submissions").select("*").eq("archived", false).order("submitted_at", { ascending: false }).limit(20);
  if (profile.role === "foreman") query = query.eq("foreman_id", profile.id);
  else if (!hasRole(profile, ["coo", "super_admin"])) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { data, error } = await query;
  return error ? NextResponse.json({ error: error.message }, { status: 500 }) : NextResponse.json(data);
}
