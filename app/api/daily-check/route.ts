export const preferredRegion = "syd1";

import { NextResponse } from "next/server";
import { getViewer } from "@/lib/authorization";
import { checkFieldsFor, periodAnchor, type Cadence } from "@/lib/dailyChecks";
import type { DailyValue, UserRole } from "@/lib/types";

const CADENCES: Cadence[] = ["daily", "weekly", "monthly"];
function asCadence(v: unknown): Cadence {
  return CADENCES.includes(v as Cadence) ? (v as Cadence) : "daily";
}

// Keep only known fields for the viewer's role + cadence, coercing to type.
function sanitize(role: UserRole, cadence: Cadence, raw: unknown): Record<string, DailyValue> {
  const fields = checkFieldsFor(role, cadence);
  const input = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const clean: Record<string, DailyValue> = {};
  for (const f of fields) {
    const v = input[f.key];
    if (f.type === "boolean") clean[f.key] = v === true;
    else clean[f.key] = Number.isFinite(Number(v)) ? Math.max(0, Number(v)) : 0;
  }
  return clean;
}

export async function POST(request: Request) {
  const { supabase, user, profile } = await getViewer();
  if (!user || !profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!profile.role || !profile.active || profile.archived)
    return NextResponse.json({ error: "No active role" }, { status: 403 });

  const body = (await request.json().catch(() => ({}))) as { values?: unknown; note?: string; cadence?: string };
  const cadence = asCadence(body.cadence);
  const values = sanitize(profile.role, cadence, body.values);
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
  // RLS scopes both queries: own + (managers) everyone / (foreman) sparkies.
  const [{ data: checks, error }, { data: roster }] = await Promise.all([
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
  ]);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({
    profileId: profile.id,
    role: profile.role,
    date,
    cadence,
    checks: checks ?? [],
    roster: roster ?? [],
  });
}
