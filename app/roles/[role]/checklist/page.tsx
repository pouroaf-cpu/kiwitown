export const preferredRegion = "syd1";

import { redirect } from "next/navigation";
import { getViewer, hasRole } from "@/lib/authorization";
import { createAdminClient } from "@/lib/supabase/admin";
import ReadOnlyFrame from "@/components/ReadOnlyFrame";
import SparkyRoster from "@/components/SparkyRoster";
import DailyCheckSection, { type DailyData } from "@/components/DailyCheckSection";
import { businessDate } from "@/lib/dailyChecks";
import type { DailyCheck, DailyCheckWithProfile, Profile, UserRole } from "@/lib/types";

const ROLE_OF: Record<string, UserRole> = { coo: "coo", foreman: "foreman", "office-admin": "office_admin", sparky: "sparky" };
const LABEL: Record<string, string> = { coo: "COO", foreman: "Operating manager", "office-admin": "Office admin", sparky: "Sparky" };

// Read-only cross-role Checklist, for super_admin + COO.
export default async function RoleChecklistPage({ params }: { params: Promise<{ role: string }> }) {
  const { supabase, user, profile } = await getViewer();
  if (!user) redirect("/login");
  if (!hasRole(profile, ["super_admin", "coo"])) redirect("/pending");

  const { role } = await params;
  const r = ROLE_OF[role];
  if (!r) redirect("/");

  if (r === "sparky") {
    return (
      <ReadOnlyFrame label="Sparky · Checklist">
        <SparkyRoster supabase={supabase} mode="checklist" />
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
    <ReadOnlyFrame label={`${LABEL[role]} · Checklist`}>
      <div className="industrial-grid min-h-screen">
        <main className="mx-auto max-w-3xl px-5 pb-28 pt-8 md:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand">Daily checklist</p>
          <h1 className="mt-3 font-display text-4xl uppercase text-white md:text-5xl">{LABEL[role]}</h1>
          <div className="mt-8">
            <DailyCheckSection role={r} preview={preview} />
          </div>
        </main>
      </div>
    </ReadOnlyFrame>
  );
}
