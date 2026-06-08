export const dynamic = "force-dynamic";
export const preferredRegion = "syd1";

import { redirect } from "next/navigation";
import { getViewer } from "@/lib/authorization";
import { businessDate } from "@/lib/dailyChecks";
import type { Profile } from "@/lib/types";
import SettingsHub from "@/components/SettingsHub";
import CooView from "@/app/coo/CooView";
import OfficeAdminView from "@/app/office-admin/OfficeAdminView";
import ForemanView from "@/app/foreman/ForemanView";
import SparkyView from "@/app/sparky/SparkyView";
import ChecklistScreen from "@/components/ChecklistScreen";

// Role-based landing, rendered INLINE (no redirect hop). The PWA start_url is
// "/", so rendering each role's destination here — instead of redirecting to it
// — saves a whole extra request + auth/profile round-trip on every app launch.
//  super_admin → Settings · coo → own Dashboard
//  others      → their Checklist until today's check exists, then Dashboard
export default async function RootPage() {
  const { supabase, user, profile } = await getViewer();
  if (!user) redirect("/login");
  if (!profile?.role || !profile.active || profile.archived) redirect("/pending");

  const p = profile as Profile;
  const role = p.role!;
  if (role === "super_admin") return <SettingsHub viewer={p} />;
  if (role === "coo") return <CooView supabase={supabase} profile={p} showDailyCheck={false} />;

  const { data: check } = await supabase
    .from("daily_checks")
    .select("id")
    .eq("profile_id", p.id)
    .eq("cadence", "daily")
    .eq("check_date", businessDate())
    .maybeSingle();

  const userName = p.name || p.phone || p.email || "You";
  if (!check) return <ChecklistScreen role={role} userName={userName} />;
  if (role === "office_admin") return <OfficeAdminView supabase={supabase} profile={p} showDailyCheck={false} />;
  if (role === "foreman") return <ForemanView supabase={supabase} profile={p} showDailyCheck={false} />;
  return <SparkyView supabase={supabase} profile={p} showDailyCheck={false} />;
}
