"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { KpiEntry, KpiType } from "@/lib/types";
import NotificationPrompt from "@/components/NotificationPrompt";
import AppShell from "@/components/AppShell";
import DailyCheckSection, { type DailyData } from "@/components/DailyCheckSection";
import TeamCompletion, { type TeamRow } from "@/components/TeamCompletion";
import KpiCharts from "@/components/KpiCharts";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

interface Props {
  sparkyName: string;
  kpiEntry: KpiEntry | null;
  entries: KpiEntry[];
  currentMonth: number;
  currentYear: number;
  targets: Record<KpiType, number>;
  teamScore: number;
  dailyPreview?: DailyData;
  teamPreview?: TeamRow[];
}

export default function SparkyDashboard({
  sparkyName,
  kpiEntry,
  entries,
  currentMonth,
  currentYear,
  targets,
  teamScore,
  dailyPreview,
  teamPreview,
}: Props) {
  const supabase = createClient();
  const [barWidth, setBarWidth] = useState(0);
  const animated = useRef(false);

  useEffect(() => {
    if (kpiEntry && !animated.current) {
      animated.current = true;
      const t = setTimeout(() => setBarWidth(kpiEntry.score), 100);
      return () => clearTimeout(t);
    }
  }, [kpiEntry]);

  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  const monthLabel = `${MONTHS[currentMonth - 1]} ${currentYear}`;

  return (
    <AppShell role="sparky" userName={sparkyName} onSignOut={signOut}>
      <div className="space-y-4 px-4 pb-28 md:mx-auto md:max-w-5xl md:px-8">
        <DailyCheckSection role="sparky" preview={dailyPreview} />

        <TeamCompletion preview={teamPreview} />

        {/* Current-month score */}
        <div className="rounded-2xl border border-border bg-surface p-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-text-secondary">{monthLabel}</p>
          <div className="mb-4 flex items-start justify-between">
            <div>
              <p className="mb-1 text-xs uppercase tracking-widest text-text-secondary">Monthly score</p>
              {kpiEntry ? (
                <div className="text-4xl font-bold text-brand">
                  {kpiEntry.score}
                  <span className="text-xl font-normal text-text-secondary">/100</span>
                </div>
              ) : (
                <div className="text-4xl font-bold text-muted">
                  —<span className="text-xl font-normal text-text-secondary">/100</span>
                </div>
              )}
            </div>
            <div className="text-right">
              <p className="mb-1 text-xs text-text-secondary">Bonus earned</p>
              {kpiEntry ? (
                <p className="text-2xl font-bold text-green-400">${Number(kpiEntry.bonus_earned).toFixed(0)}</p>
              ) : (
                <p className="text-2xl font-bold text-muted">$—</p>
              )}
            </div>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-border">
            <div className="h-full rounded-full bg-brand transition-all duration-700 ease-out" style={{ width: `${barWidth}%` }} />
          </div>
          {!kpiEntry && (
            <p className="mt-3 text-center text-xs text-muted">Your admin enters KPI figures each month — check back soon.</p>
          )}
          <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
            <span className="text-xs uppercase tracking-widest text-text-secondary">Team score</span>
            <span className="text-lg font-semibold text-white">
              {teamScore.toFixed(1)}
              <span className="text-sm text-text-secondary">/100</span>
            </span>
          </div>
          <NotificationPrompt />
        </div>

        {/* KPI charts with period selector */}
        <KpiCharts entries={entries} targets={targets} currentYear={currentYear} />
      </div>
    </AppShell>
  );
}
