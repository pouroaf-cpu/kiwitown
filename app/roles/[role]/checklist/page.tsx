export const preferredRegion = "syd1";

import { redirect } from "next/navigation";
import { getViewer, hasRole } from "@/lib/authorization";
import { createAdminClient } from "@/lib/supabase/admin";
import ViewerShell from "@/components/ViewerShell";
import SparkyRoster from "@/components/SparkyRoster";
import DailyCheckSection, { type DailyData } from "@/components/DailyCheckSection";
import { ROLE_LABELS, businessDate } from "@/lib/dailyChecks";
import type { DailyCheck, DailyCheckWithProfile, Profile, UserRole } from "@/lib/types";

const ROLE_OF: Record<string, UserRole> = { coo: "coo", foreman: "foreman", "office-admin": "office_admin", sparky: "sparky" };

// Cross-role Checklist for super_admin + COO — viewer's own sidebar (navRole).
export default async function RoleChecklistPage({ params }: { params: Promise<{ role: string }> }) {
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
        <SparkyRoster supabase={supabase} mode="checklist" />
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
  // No real account of this role yet: render the checklist with an empty
  // placeholder profile (all-zero id matches no rows) instead of bouncing.
  const target: Profile = (data as Profile | null) ?? {
    id: "00000000-0000-0000-0000-000000000000",
    user_id: "",
    name: `No ${ROLE_LABELS[r]} account yet`,
    email: "",
    phone: "",
    role: r,
    salary: 0,
    bonus_pct: 0,
    active: true,
    archived: false,
    created_at: new Date().toISOString(),
  };

  const { data: check } = await admin
    .from("daily_checks")
    .select("*")
    .eq("profile_id", target.id)
    .eq("check_date", businessDate())
    .maybeSingle();
  const checks: DailyCheckWithProfile[] = check
    ? [{ ...(check as DailyCheck), profile: { name: target.name, email: target.email, role: r } }]
    : [];
  const preview: DailyData = {
    profileId: target.id,
    role: r,
    date: businessDate(),
    checks,
    roster: [{ id: target.id, name: target.name, email: target.email, role: r }],
    statusRows: [],
  };

  return (
    <ViewerShell navRole={navRole} userName={userName}>
      <div className="mx-auto max-w-3xl px-5 pb-28 md:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand">{ROLE_LABELS[r]} checklist</p>
        <h1 className="mt-3 font-display text-3xl uppercase text-white md:text-4xl">Daily check</h1>
        <div className="mt-8">
          <DailyCheckSection role={r} preview={preview} />
        </div>
      </div>
    </ViewerShell>
  );
}
