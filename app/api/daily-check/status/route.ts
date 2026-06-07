export const preferredRegion = "syd1";

import { NextResponse } from "next/server";
import { getViewer, hasRole } from "@/lib/authorization";
import { businessDate } from "@/lib/dailyChecks";

// Completion board: who has / hasn't submitted today. No figures exposed — the
// daily_check_status RPC returns only a submitted flag per person.
export async function GET() {
  const { supabase, user, profile } = await getViewer();
  if (!user || !profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasRole(profile, ["coo", "super_admin"]))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const date = businessDate();
  const { data, error } = await supabase.rpc("daily_check_status", { p_date: date });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ date, status: data ?? [] });
}
