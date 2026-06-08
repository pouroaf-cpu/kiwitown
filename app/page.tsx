export const dynamic = "force-dynamic";
export const preferredRegion = "syd1";

import { redirect } from "next/navigation";
import { getViewer } from "@/lib/authorization";
import { businessDate } from "@/lib/dailyChecks";

const ROLE_BASE: Record<string, string> = {
  coo: "/coo",
  office_admin: "/office-admin",
  foreman: "/foreman",
  sparky: "/sparky",
};

// Role-based landing:
//  super_admin → Settings
//  coo        → own Dashboard
//  others     → their Checklist until today's check is complete, then Dashboard
export default async function RootPage() {
  const { supabase, user, profile } = await getViewer();
  if (!user) redirect("/login");
  if (!profile?.role || !profile.active || profile.archived) redirect("/pending");

  const role = profile.role;
  if (role === "super_admin") redirect("/settings");
  if (role === "coo") redirect("/coo");

  const base = ROLE_BASE[role];
  if (!base) redirect("/pending");

  const { data: check } = await supabase
    .from("daily_checks")
    .select("*")
    .eq("profile_id", profile.id)
    .eq("cadence", "daily")
    .eq("check_date", businessDate())
    .maybeSingle();

  redirect(check ? base : `${base}/checklist`);
}
