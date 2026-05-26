import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
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

export default async function ForemanPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, name, phone, role")
    .eq("user_id", user.id)
    .single();

  if (!profile || (profile.role !== "foreman" && profile.role !== "admin")) redirect("/pending");

  const { weekNum, year } = getWeekInfo();

  const { data: existingSubmission } = await supabase
    .from("weekly_submissions")
    .select("id, checklist, notes, submitted_at")
    .eq("foreman_id", profile.id)
    .eq("week_number", weekNum)
    .eq("year", year)
    .maybeSingle();

  const displayName = profile.name?.trim() || profile.phone || "Foreman";

  return (
    <ForemanDashboard
      foremanName={displayName}
      profileId={profile.id}
      weekNum={weekNum}
      year={year}
      existingSubmission={existingSubmission ?? null}
    />
  );
}
