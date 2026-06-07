export const preferredRegion = "syd1";

import { redirect } from "next/navigation";
import { getViewer, hasRole } from "@/lib/authorization";
import { createAdminClient } from "@/lib/supabase/admin";
import ViewerShell from "@/components/ViewerShell";
import SparkyRoster from "@/components/SparkyRoster";
import CooView from "@/app/coo/CooView";
import ForemanView from "@/app/foreman/ForemanView";
import OfficeAdminView from "@/app/office-admin/OfficeAdminView";
import type { Profile, UserRole } from "@/lib/types";

const ROLE_OF: Record<string, UserRole> = { coo: "coo", foreman: "foreman", "office-admin": "office_admin", sparky: "sparky" };

// Cross-role Dashboard for super_admin + COO — rendered with the viewer's own
// sidebar (navRole), so no separate header is needed.
export default async function RoleDashboardPage({ params }: { params: Promise<{ role: string }> }) {
  const { supabase, user, profile } = await getViewer();
  if (!user) redirect("/login");
  if (!hasRole(profile, ["super_admin", "coo"])) redirect("/pending");

  const { role } = await params;
  const r = ROLE_OF[role];
  if (!r) redirect("/");
  const navRole = profile!.role!;
  const userName = profile!.name || profile!.email || "Admin";

  if (r === "sparky") {
    return (
      <ViewerShell navRole={navRole} userName={userName}>
        <SparkyRoster supabase={supabase} mode="dashboard" />
      </ViewerShell>
    );
  }

  const admin = createAdminClient();
  const { data } = await admin
    .from("profiles")
    .select("*")
    .eq("role", r)
    .eq("active", true)
    .eq("archived", false)
    .order("created_at")
    .limit(1)
    .maybeSingle();
  if (!data) redirect("/");
  const target = data as Profile;

  if (r === "coo") return <CooView supabase={supabase} profile={target} showDailyCheck={false} navRole={navRole} />;
  if (r === "foreman") return <ForemanView supabase={supabase} profile={target} showDailyCheck={false} navRole={navRole} />;
  return <OfficeAdminView supabase={supabase} profile={target} showDailyCheck={false} navRole={navRole} />;
}
