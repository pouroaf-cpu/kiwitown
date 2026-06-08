import { Suspense } from "react";
import type { ServerClient } from "@/lib/supabase/server";
import type { AuditEvent, ChecklistItem, KpiEntry, KpiTarget, Profile, UserRole } from "@/lib/types";
import CooFrame, { CooSkeleton } from "./dashboard";
import CooPanels from "./panels";

// Async data loader — staff + monthly KPIs + checklist + targets + audit.
async function CooData({ supabase, viewer, month, year, showDailyCheck }: { supabase: ServerClient; viewer: Profile; month: number; year: number; showDailyCheck?: boolean }) {
  const [{ data: staff }, { data: kpis }, { data: checklist }, { data: targets }, { data: audit }] = await Promise.all([
    supabase.from("profiles").select("*").eq("archived", false).order("name"),
    supabase.from("kpi_entries").select("*").eq("archived", false).eq("month", month).eq("year", year),
    supabase.from("checklist_items").select("*").eq("archived", false).order("order_index"),
    supabase.from("kpi_targets").select("*").eq("archived", false).order("effective_from", { ascending: false }),
    supabase.from("audit_log").select("id,user_id,action,table_name,record_id,created_at").order("created_at", { ascending: false }).limit(15),
  ]);
  return (
    <CooPanels
      viewer={viewer}
      initialStaff={(staff ?? []) as Profile[]}
      initialEntries={(kpis ?? []) as KpiEntry[]}
      initialChecklist={(checklist ?? []) as ChecklistItem[]}
      initialTargets={(targets ?? []) as KpiTarget[]}
      initialAudit={(audit ?? []) as AuditEvent[]}
      month={month}
      year={year}
      showDailyCheck={showDailyCheck}
    />
  );
}

export default function CooView({
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
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  return (
    <CooFrame viewer={profile} month={month} year={year} navRole={navRole}>
      <Suspense fallback={<CooSkeleton />}>
        <CooData supabase={supabase} viewer={profile} month={month} year={year} showDailyCheck={showDailyCheck} />
      </Suspense>
    </CooFrame>
  );
}
