export const preferredRegion = "syd1";

import { redirect } from "next/navigation";
import { getViewer, hasRole } from "@/lib/authorization";
import type { AuditEvent, ChecklistItem, KpiEntry, KpiTarget, Profile } from "@/lib/types";
import CooDashboard from "./dashboard";

export default async function CooPage() {
  const { supabase, user, profile } = await getViewer();
  if (!user) redirect("/login");
  if (!hasRole(profile, ["coo", "super_admin"])) redirect("/pending");
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const [{ data: staff }, { data: kpis }, { data: checklist }, { data: targets }, { data: audit }] = await Promise.all([
    supabase.from("profiles").select("*").eq("archived", false).order("name"),
    supabase.from("kpi_entries").select("*").eq("archived", false).eq("month", month).eq("year", year),
    supabase.from("checklist_items").select("*").eq("archived", false).order("order_index"),
    supabase.from("kpi_targets").select("*").eq("archived", false).order("effective_from", { ascending: false }),
    supabase.from("audit_log").select("id,user_id,action,table_name,record_id,created_at").order("created_at", { ascending: false }).limit(15),
  ]);
  return (
    <CooDashboard
      viewer={profile!}
      initialStaff={(staff ?? []) as Profile[]}
      initialEntries={(kpis ?? []) as KpiEntry[]}
      initialChecklist={(checklist ?? []) as ChecklistItem[]}
      initialTargets={(targets ?? []) as KpiTarget[]}
      initialAudit={(audit ?? []) as AuditEvent[]}
      month={month}
      year={year}
    />
  );
}
