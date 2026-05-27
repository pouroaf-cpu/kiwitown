export const preferredRegion = "syd1";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ForemanDashboard from "./dashboard";
import type { ChecklistItem, KpiEntry, WeeklySubmission } from "@/lib/types";

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

export default async function ForemanPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, name, phone, role")
    .eq("user_id", user.id)
    .single();

  if (!profile || profile.role !== "foreman") redirect("/pending");

  const { weekNum, year } = getWeekInfo();

  const [{ data: existingSubmission }, { data: history }, { data: checklistItems }, { data: teamEntries }, { data: sparkies }] = await Promise.all([
    supabase.from("weekly_submissions").select("*").eq("foreman_id", profile.id).eq("week_number", weekNum).eq("year", year).eq("archived", false).maybeSingle(),
    supabase.from("weekly_submissions").select("*").eq("foreman_id", profile.id).eq("archived", false).order("submitted_at", { ascending: false }).limit(8),
    supabase.from("checklist_items").select("*").eq("active", true).eq("archived", false).order("order_index"),
    supabase.from("kpi_entries").select("*").eq("month", new Date().getMonth() + 1).eq("year", new Date().getFullYear()).eq("archived", false),
    supabase.from("profiles").select("id,name,phone").eq("role", "sparky").eq("archived", false),
  ]);

  const displayName = profile.name?.trim() || profile.phone || "Foreman";

  return (
    <ForemanDashboard
      foremanName={displayName}
      weekNum={weekNum}
      year={year}
      existingSubmission={(existingSubmission ?? null) as WeeklySubmission | null}
      history={(history ?? []) as WeeklySubmission[]}
      checklistItems={(checklistItems ?? []) as ChecklistItem[]}
      teamEntries={(teamEntries ?? []) as KpiEntry[]}
      sparkies={(sparkies ?? []) as { id: string; name: string; phone: string }[]}
    />
  );
}
