export const preferredRegion = "syd1";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SparkyDashboard from "./dashboard";
import type { KpiEntry, KpiTarget } from "@/lib/types";
import { resolveTargets } from "@/lib/kpi";

export default async function SparkyPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, name, email, phone, role")
    .eq("user_id", user.id)
    .single();

  if (!profile || profile.role !== "sparky") redirect("/pending");

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  // Fetch current entry + 6-month history in parallel
  const [{ data: kpiEntry }, { data: history }, { data: targets }, { data: teamScore }] = await Promise.all([
    supabase
      .from("kpi_entries")
      .select("*")
      .eq("sparky_id", profile.id)
      .eq("month", month)
      .eq("year", year)
      .maybeSingle(),
    supabase
      .from("kpi_entries")
      .select("month, year, score, bonus_earned")
      .eq("sparky_id", profile.id)
      .order("year", { ascending: false })
      .order("month", { ascending: false })
      .limit(6),
    supabase.from("kpi_targets").select("*").eq("archived", false).order("effective_from", { ascending: false }),
    supabase.rpc("get_team_score", { p_month: month, p_year: year }),
  ]);

  return (
    <SparkyDashboard
      sparkyName={profile.name?.trim() || profile.email || profile.phone || "Sparky"}
      kpiEntry={(kpiEntry ?? null) as KpiEntry | null}
      history={(history ?? []) as Pick<KpiEntry, "month" | "year" | "score" | "bonus_earned">[]}
      currentMonth={month}
      currentYear={year}
      targets={resolveTargets((targets ?? []) as KpiTarget[], profile.id)}
      teamScore={Number(teamScore ?? 0)}
    />
  );
}
