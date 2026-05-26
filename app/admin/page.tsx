import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminDashboard from "./dashboard";
import type { Profile, KpiEntry } from "@/lib/types";

export default async function AdminPage() {
  const supabase = createClient();

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

  const { data: allProfiles } = await supabase
    .from("profiles")
    .select("id, user_id, name, phone, role, salary, bonus_pct, created_at")
    .order("created_at", { ascending: true });

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const { data: kpiEntries } = await supabase
    .from("kpi_entries")
    .select("*")
    .eq("month", month)
    .eq("year", year);

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
