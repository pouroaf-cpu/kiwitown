export const preferredRegion = "syd1";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SparkyDashboard from "./dashboard";
import type { KpiEntry } from "@/lib/types";

export default async function SparkyPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, name, phone, role")
    .eq("user_id", user.id)
    .single();

  if (!profile || (profile.role !== "sparky" && profile.role !== "admin")) redirect("/pending");

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  // Fetch current entry + 6-month history in parallel
  const [{ data: kpiEntry }, { data: history }] = await Promise.all([
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
  ]);

  return (
    <SparkyDashboard
      sparkyName={profile.name?.trim() || profile.phone || "Sparky"}
      kpiEntry={(kpiEntry ?? null) as KpiEntry | null}
      history={(history ?? []) as Pick<KpiEntry, "month" | "year" | "score" | "bonus_earned">[]}
      currentMonth={month}
      currentYear={year}
    />
  );
}
