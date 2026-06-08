import { Suspense } from "react";
import type { ServerClient } from "@/lib/supabase/server";
import type { KpiEntry, KpiTarget, Profile } from "@/lib/types";
import { resolveTargets } from "@/lib/kpi";
import SparkyFrame, { SparkySkeleton } from "./dashboard";
import SparkyPanels from "./panels";

// Async data loader — current entry + 6-month history + targets + team score.
async function SparkyData({ supabase, profile, showDailyCheck }: { supabase: ServerClient; profile: Profile; showDailyCheck?: boolean }) {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const [{ data: kpiEntry }, { data: history }, { data: targets }, { data: teamScore }] = await Promise.all([
    supabase
      .from("kpi_entries")
      .select("*")
      .eq("sparky_id", profile.id)
      .eq("month", month)
      .eq("year", year)
      .maybeSingle(),
    supabase
      .from("kpi_entries")
      .select("*")
      .eq("sparky_id", profile.id)
      .order("year", { ascending: false })
      .order("month", { ascending: false })
      .limit(12),
    supabase.from("kpi_targets").select("*").eq("archived", false).order("effective_from", { ascending: false }),
    supabase.rpc("get_team_score", { p_month: month, p_year: year }),
  ]);

  return (
    <SparkyPanels
      kpiEntry={(kpiEntry ?? null) as KpiEntry | null}
      entries={(history ?? []) as KpiEntry[]}
      currentMonth={month}
      currentYear={year}
      targets={resolveTargets((targets ?? []) as KpiTarget[], profile.id)}
      teamScore={Number(teamScore ?? 0)}
      showDailyCheck={showDailyCheck}
    />
  );
}

export default function SparkyView({
  supabase,
  profile,
  showDailyCheck,
}: {
  supabase: ServerClient;
  profile: Profile;
  showDailyCheck?: boolean;
}) {
  const sparkyName = profile.name?.trim() || profile.email || profile.phone || "Sparky";
  return (
    <SparkyFrame sparkyName={sparkyName}>
      <Suspense fallback={<SparkySkeleton />}>
        <SparkyData supabase={supabase} profile={profile} showDailyCheck={showDailyCheck} />
      </Suspense>
    </SparkyFrame>
  );
}
