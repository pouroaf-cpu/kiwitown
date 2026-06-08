import { Suspense } from "react";
import type { ServerClient } from "@/lib/supabase/server";
import type { ChecklistItem, KpiEntry, Profile, UserRole, WeeklySubmission } from "@/lib/types";
import ForemanFrame, { ForemanSkeleton } from "./dashboard";
import ForemanPanels from "./panels";

function getWeekInfo(): { weekNum: number; year: number } {
  const now = new Date();
  const tmp = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  const dayN = tmp.getUTCDay() || 7;
  tmp.setUTCDate(tmp.getUTCDate() + 4 - dayN);
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
  const weekNum = Math.ceil(
    ((tmp.getTime() - yearStart.getTime()) / 86400000 + 1) / 7
  );
  return { weekNum, year: now.getFullYear() };
}

// Async data loader — current submission + history + checklist + team KPIs.
async function ForemanData({ supabase, profile, weekNum, year, showDailyCheck }: { supabase: ServerClient; profile: Profile; weekNum: number; year: number; showDailyCheck?: boolean }) {
  const [{ data: existingSubmission }, { data: history }, { data: checklistItems }, { data: teamEntries }, { data: sparkies }] = await Promise.all([
    supabase.from("weekly_submissions").select("*").eq("foreman_id", profile.id).eq("week_number", weekNum).eq("year", year).eq("archived", false).maybeSingle(),
    supabase.from("weekly_submissions").select("*").eq("foreman_id", profile.id).eq("archived", false).order("submitted_at", { ascending: false }).limit(8),
    supabase.from("checklist_items").select("*").eq("active", true).eq("archived", false).order("order_index"),
    supabase.from("kpi_entries").select("*").eq("month", new Date().getMonth() + 1).eq("year", new Date().getFullYear()).eq("archived", false),
    supabase.from("profiles").select("id,name,email,phone").eq("role", "sparky").eq("archived", false),
  ]);

  return (
    <ForemanPanels
      weekNum={weekNum}
      year={year}
      existingSubmission={(existingSubmission ?? null) as WeeklySubmission | null}
      history={(history ?? []) as WeeklySubmission[]}
      checklistItems={(checklistItems ?? []) as ChecklistItem[]}
      teamEntries={(teamEntries ?? []) as KpiEntry[]}
      sparkies={(sparkies ?? []) as { id: string; name: string; email: string; phone: string }[]}
      showDailyCheck={showDailyCheck}
    />
  );
}

export default function ForemanView({
  supabase,
  profile,
  showDailyCheck,
  navRole,
}: {
  supabase: ServerClient;
  profile: Profile;
  showDailyCheck?: boolean;
  navRole?: UserRole;
}) {
  const { weekNum, year } = getWeekInfo();
  const displayName = profile.name?.trim() || profile.email || profile.phone || "Foreman";

  return (
    <ForemanFrame foremanName={displayName} weekNum={weekNum} year={year} navRole={navRole}>
      <Suspense fallback={<ForemanSkeleton />}>
        <ForemanData supabase={supabase} profile={profile} weekNum={weekNum} year={year} showDailyCheck={showDailyCheck} />
      </Suspense>
    </ForemanFrame>
  );
}
