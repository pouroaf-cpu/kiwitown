export const preferredRegion = "syd1";

import { NextResponse } from "next/server";
import { getViewer, hasRole } from "@/lib/authorization";

export async function POST(request: Request) {
  const { supabase, user, profile } = await getViewer();
  if (!user || !hasRole(profile, ["coo", "super_admin"])) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await request.json() as { month?: number; year?: number };
  if (!body.month || !body.year) return NextResponse.json({ error: "Month and year required" }, { status: 400 });
  const { data: entries, error: entriesError } = await supabase.from("kpi_entries").select("score,bonus_earned").eq("month", body.month).eq("year", body.year).eq("archived", false);
  if (entriesError) return NextResponse.json({ error: entriesError.message }, { status: 500 });
  const summary = {
    sparkies: entries?.length ?? 0,
    average_score: entries?.length ? Number((entries.reduce((sum, entry) => sum + Number(entry.score), 0) / entries.length).toFixed(2)) : 0,
    total_bonus: Number((entries ?? []).reduce((sum, entry) => sum + Number(entry.bonus_earned), 0).toFixed(2)),
  };
  const { data, error } = await supabase.from("month_end_runs").upsert({
    month: body.month,
    year: body.year,
    closed_by: user.id,
    summary,
  }, { onConflict: "month,year" }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await supabase.from("kpi_entries").update({ month_closed_at: data.closed_at }).eq("month", body.month).eq("year", body.year).eq("archived", false);
  return NextResponse.json(data);
}
