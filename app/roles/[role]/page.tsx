export const preferredRegion = "syd1";

import { redirect } from "next/navigation";
import { getViewer, hasRole } from "@/lib/authorization";
import { createAdminClient } from "@/lib/supabase/admin";
import ReadOnlyFrame from "@/components/ReadOnlyFrame";
import SparkyRoster from "@/components/SparkyRoster";
import CooView from "@/app/coo/CooView";
import ForemanView from "@/app/foreman/ForemanView";
import OfficeAdminView from "@/app/office-admin/OfficeAdminView";
import type { Profile, UserRole } from "@/lib/types";

const ROLE_OF: Record<string, UserRole> = { coo: "coo", foreman: "foreman", "office-admin": "office_admin", sparky: "sparky" };
const LABEL: Record<string, string> = { coo: "COO", foreman: "Operating manager", "office-admin": "Office admin", sparky: "Sparky" };

// Read-only cross-role Dashboard, for super_admin + COO.
export default async function RoleDashboardPage({ params }: { params: Promise<{ role: string }> }) {
  const { supabase, user, profile } = await getViewer();
  if (!user) redirect("/login");
  if (!hasRole(profile, ["super_admin", "coo"])) redirect("/pending");

  const { role } = await params;
  const r = ROLE_OF[role];
  if (!r) redirect("/");

  if (r === "sparky") {
    return (
      <ReadOnlyFrame label="Sparky · Dashboard">
        <SparkyRoster supabase={supabase} mode="dashboard" />
      </ReadOnlyFrame>
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

  const inner =
    r === "coo" ? <CooView supabase={supabase} profile={target} showDailyCheck={false} /> :
    r === "foreman" ? <ForemanView supabase={supabase} profile={target} showDailyCheck={false} /> :
    <OfficeAdminView supabase={supabase} profile={target} showDailyCheck={false} />;

  return <ReadOnlyFrame label={`${LABEL[role]} · Dashboard`}>{inner}</ReadOnlyFrame>;
}
