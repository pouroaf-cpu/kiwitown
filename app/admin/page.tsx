export const preferredRegion = "syd1";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminDashboard from "./dashboard";
import type { Profile, KpiEntry } from "@/lib/types";

export default async function AdminPage() {
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

  if (!profile || profile.role !== "admin") redirect("/pending");

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  // Fetch all profiles + current-month KPIs in parallel
  const [{ data: allProfiles, error: profilesError }, { data: kpiEntries }] =
    await Promise.all([
      supabase.rpc("admin_get_profiles"),
      supabase
        .from("kpi_entries")
        .select("*")
        .eq("month", month)
        .eq("year", year),
    ]);

  if (profilesError) {
    console.error("[admin] profiles error:", profilesError.message, profilesError.code);
  }

  return (
    <AdminDashboard
      adminName={profile.name?.trim() || profile.phone || "Admin"}
      initialProfiles={(allProfiles ?? []) as Profile[]}
      initialKpiEntries={(kpiEntries ?? []) as KpiEntry[]}
      currentMonth={month}
      currentYear={year}
    />
  );
}
