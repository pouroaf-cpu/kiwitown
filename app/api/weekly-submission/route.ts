import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { week_number: number; year: number; checklist: Record<string, boolean>; notes: Record<string, string> };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { week_number, year, checklist, notes } = body;

  if (!week_number || !year || !checklist || !notes) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Get foreman profile id
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("user_id", user.id)
    .single();

  if (profileError || !profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  if (profile.role !== "foreman" && profile.role !== "admin") {
    return NextResponse.json({ error: "Only foremen can submit weekly check-ins" }, { status: 403 });
  }

  // Upsert — idempotent if foreman submits again for the same week
  const { error } = await supabase
    .from("weekly_submissions")
    .upsert(
      {
        foreman_id: profile.id,
        week_number,
        year,
        checklist,
        notes,
        submitted_at: new Date().toISOString(),
      },
      { onConflict: "foreman_id,week_number,year" }
    );

  if (error) {
    console.error("[weekly-submission] Supabase error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function GET() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const { data, error } = await supabase
    .from("weekly_submissions")
    .select("*")
    .eq("foreman_id", profile.id)
    .order("submitted_at", { ascending: false })
    .limit(10);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
