export const preferredRegion = "syd1";

import { NextResponse } from "next/server";
import { getViewer } from "@/lib/authorization";
import { periodAnchor, type Cadence } from "@/lib/dailyChecks";
import type { CheckItem, DailyValue, UserRole } from "@/lib/types";

const CADENCES: Cadence[] = ["daily", "weekly", "monthly"];
function asCadence(v: unknown): Cadence {
  return CADENCES.includes(v as Cadence) ? (v as Cadence) : "daily";
}

// Coerce each answer to the right shape for its item's input type.
function sanitize(items: Pick<CheckItem, "id" | "input_type">[], raw: unknown): Record<string, DailyValue> {
  const input = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const clean: Record<string, DailyValue> = {};
  for (const it of items) {
    const v = input[it.id];
    if (it.input_type === "yes_no") clean[it.id] = v === true;
    else if (it.input_type === "number" || it.input_type === "currency")
      clean[it.id] = Number.isFinite(Number(v)) ? Math.max(0, Number(v)) : 0;
    else clean[it.id] = typeof v === "string" ? v.slice(0, 500) : "";
  }
  return clean;
}

export async function POST(request: Request) {
  const { supabase, user, profile } = await getViewer();
  if (!user || !profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!profile.role || !profile.active || profile.archived)
    return NextResponse.json({ error: "No active role" }, { status: 403 });

  const body = (await request.json().catch(() => ({}))) as { values?: unknown; note?: string; cadence?: string; happiness?: unknown; happinessNote?: string };
  const cadence = asCadence(body.cadence);

  const { data: items } = await supabase
    .from("check_items")
    .select("id, input_type")
    .eq("active", true)
    .eq("archived", false)
    .eq("draft", false)
    .eq("role", profile.role)
    .eq("cadence", cadence);

  const values = sanitize((items ?? []) as Pick<CheckItem, "id" | "input_type">[], body.values);
  // Wellbeing "How happy are you right now?" — stored alongside the check under
  // reserved keys so it surfaces in the manager rollup (no schema change).
  if (Number.isFinite(Number(body.happiness))) {
    values.__happiness = Math.min(100, Math.max(0, Math.round(Number(body.happiness))));
  }
  if (typeof body.happinessNote === "string" && body.happinessNote.trim()) {
    values.__happiness_note = body.happinessNote.slice(0, 1000);
  }
  const note = typeof body.note === "string" ? body.note.slice(0, 1000) : null;

  const { data, error } = await supabase
    .from("daily_checks")
    .upsert(
      {
        profile_id: profile.id,
        role: profile.role,
        cadence,
        check_date: periodAnchor(cadence),
        values,
        note,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "profile_id,cadence,check_date" }
    )
    .select()
    .single();

  return error
    ? NextResponse.json({ error: error.message }, { status: 500 })
    : NextResponse.json(data);
}

export async function GET(request: Request) {
  const { supabase, user, profile } = await getViewer();
  if (!user || !profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const cadence = asCadence(new URL(request.url).searchParams.get("cadence"));
  const date = periodAnchor(cadence);
  // RLS scopes the submissions; check_items + roster are readable by all.
  const [{ data: checks, error }, { data: roster }, { data: items }] = await Promise.all([
    supabase
      .from("daily_checks")
      .select("*, profile:profiles(name, email, role)")
      .eq("cadence", cadence)
      .eq("check_date", date)
      .order("created_at", { ascending: true }),
    supabase
      .from("profiles")
      .select("id, name, email, role")
      .eq("archived", false)
      .eq("active", true)
      .order("name"),
    supabase
      .from("check_items")
      .select("*")
      .eq("active", true)
      .eq("archived", false)
      .eq("draft", false)
      .eq("cadence", cadence)
      .order("role")
      .order("order_index"),
  ]);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({
    profileId: profile.id,
    role: profile.role as UserRole,
    date,
    cadence,
    checks: checks ?? [],
    roster: roster ?? [],
    items: (items ?? []) as CheckItem[],
  });
}
