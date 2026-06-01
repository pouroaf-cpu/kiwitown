import type { ServerClient } from "@/lib/supabase/server";
import type { ChecklistItem, KpiEntry, Profile, WeeklySubmission } from "@/lib/types";
import ForemanDashboard from "./dashboard";

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

export default async function ForemanView({
  supabase,
  profile,
}: {
  supabase: ServerClient;
  profile: Profile;
}) {
  const { weekNum, year } = getWeekInfo();

  const [{ data: existingSubmission }, { data: history }, { data: checklistItems }, { data: teamEntries }, { data: sparkies }] = await Promise.all([
    supabase.from("weekly_submissions").select("*").eq("foreman_id", profile.id).eq("week_number", weekNum).eq("year", year).eq("archived", false).maybeSingle(),
    supabase.from("weekly_submissions").select("*").eq("foreman_id", profile.id).eq("archived", false).order("submitted_at", { ascending: false }).limit(8),
    supabase.from("checklist_items").select("*").eq("active", true).eq("archived", false).order("order_index"),
    supabase.from("kpi_entries").select("*").eq("month", new Date().getMonth() + 1).eq("year", new Date().getFullYear()).eq("archived", false),
    supabase.from("profiles").select("id,name,email,phone").eq("role", "sparky").eq("archived", false),
  ]);

  const displayName = profile.name?.trim() || profile.email || profile.phone || "Foreman";

  return (
    <ForemanDashboard
      foremanName={displayName}
      weekNum={weekNum}
      year={year}
      existingSubmission={(existingSubmission ?? null) as WeeklySubmission | null}
      history={(history ?? []) as WeeklySubmission[]}
      checklistItems={(checklistItems ?? []) as ChecklistItem[]}
      teamEntries={(teamEntries ?? []) as KpiEntry[]}
      sparkies={(sparkies ?? []) as { id: string; name: string; email: string; phone: string }[]}
    />
  );
}
