export const preferredRegion = "syd1";

import { NextResponse } from "next/server";
import { getViewer, hasRole } from "@/lib/authorization";
import type { KpiType } from "@/lib/types";

const targetTypes: KpiType[] = ["charge_out", "job_cards", "callbacks", "timesheets_days"];

export async function GET() {
  const { supabase, user } = await getViewer();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data, error } = await supabase.from("kpi_targets").select("*").eq("archived", false).order("effective_from", { ascending: false });
  return error ? NextResponse.json({ error: error.message }, { status: 500 }) : NextResponse.json(data);
}

export async function POST(request: Request) {
  const { supabase, user, profile } = await getViewer();
  if (!user || !hasRole(profile, ["coo", "super_admin"])) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await request.json() as { sparky_id?: string | null; target_type?: KpiType; value?: number; effective_from?: string };
  if (!body.target_type || !targetTypes.includes(body.target_type) || typeof body.value !== "number" || !body.effective_from) {
    return NextResponse.json({ error: "Type, value and effective date are required" }, { status: 400 });
  }
  const closeDate = new Date(body.effective_from);
  closeDate.setUTCDate(closeDate.getUTCDate() - 1);
  let previous = supabase.from("kpi_targets").update({ effective_to: closeDate.toISOString().slice(0, 10) })
    .eq("target_type", body.target_type).is("effective_to", null).eq("archived", false);
  previous = body.sparky_id ? previous.eq("sparky_id", body.sparky_id) : previous.is("sparky_id", null);
  await previous;
  const { data, error } = await supabase.from("kpi_targets").insert({
    sparky_id: body.sparky_id ?? null,
    target_type: body.target_type,
    value: body.value,
    effective_from: body.effective_from,
  }).select().single();
  return error ? NextResponse.json({ error: error.message }, { status: 500 }) : NextResponse.json(data);
}
