export const preferredRegion = "syd1";

import { NextResponse } from "next/server";
import { getViewer, hasRole } from "@/lib/authorization";
import { calculateBonus, calculateScore, resolveTargets } from "@/lib/kpi";
import type { KpiTarget } from "@/lib/types";

export async function POST(request: Request) {
  const { supabase, user, profile } = await getViewer();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasRole(profile, ["coo", "super_admin"])) return NextResponse.json({ error: "Only COO or system owner can enter KPI data" }, { status: 403 });
  const body = await request.json() as {
    sparky_id?: string; month?: number; year?: number; charge_out?: number; job_cards?: number; callbacks?: number; timesheets_days?: number;
  };
  if (!body.sparky_id || !body.month || !body.year || [body.charge_out, body.job_cards, body.callbacks, body.timesheets_days].some((value) => typeof value !== "number")) {
    return NextResponse.json({ error: "All KPI fields are required" }, { status: 400 });
  }
  const [{ data: sparky }, { data: targetRows }] = await Promise.all([
    supabase.from("profiles").select("id, salary, bonus_pct").eq("id", body.sparky_id).eq("role", "sparky").eq("archived", false).maybeSingle(),
    supabase.from("kpi_targets").select("*").eq("archived", false).lte("effective_from", `${body.year}-${String(body.month).padStart(2, "0")}-28`).order("effective_from", { ascending: false }),
  ]);
  if (!sparky) return NextResponse.json({ error: "Sparky not found" }, { status: 404 });
  const values = {
    charge_out: Number(body.charge_out),
    job_cards: Number(body.job_cards),
    callbacks: Number(body.callbacks),
    timesheets_days: Number(body.timesheets_days),
  };
  const score = calculateScore(values, resolveTargets((targetRows ?? []) as KpiTarget[], sparky.id));
  const bonus_earned = calculateBonus(score, Number(sparky.salary), Number(sparky.bonus_pct));
  const { data, error } = await supabase.from("kpi_entries").upsert({
    sparky_id: sparky.id,
    month: body.month,
    year: body.year,
    ...values,
    score,
    bonus_earned,
    source: "manual",
    entered_by: profile!.id,
    archived: false,
  }, { onConflict: "sparky_id,month,year" }).select().single();
  return error ? NextResponse.json({ error: error.message }, { status: 500 }) : NextResponse.json(data);
}

export async function GET(request: Request) {
  const { supabase, user, profile } = await getViewer();
  if (!user || !profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const url = new URL(request.url);
  let query = supabase.from("kpi_entries").select("*").eq("archived", false).order("year", { ascending: false }).order("month", { ascending: false });
  if (profile.role === "sparky") query = query.eq("sparky_id", profile.id);
  else if (profile.role === "foreman" || profile.role === "coo" || profile.role === "super_admin") {
    const month = url.searchParams.get("month");
    const year = url.searchParams.get("year");
    if (month) query = query.eq("month", Number(month));
    if (year) query = query.eq("year", Number(year));
  } else return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { data, error } = await query.limit(24);
  return error ? NextResponse.json({ error: error.message }, { status: 500 }) : NextResponse.json(data);
}
