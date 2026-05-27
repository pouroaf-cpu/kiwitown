"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { KpiEntry, KpiType } from "@/lib/types";
import BottomNav from "@/components/BottomNav";
import TopNav from "@/components/TopNav";
import NotificationPrompt from "@/components/NotificationPrompt";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

interface KpiMeta {
  key: keyof Pick<KpiEntry, "charge_out" | "job_cards" | "callbacks" | "timesheets_days">;
  label: string;
  unit: string;
  target: number;
  targetLabel: string;
  icon: string;
  color: string;
  lowerBetter?: boolean;
}

const KPI_META: KpiMeta[] = [
  {
    key: "charge_out",
    label: "Charge Out",
    unit: "%",
    target: 85,
    targetLabel: "85%",
    icon: "⚡",
    color: "text-brand",
  },
  {
    key: "job_cards",
    label: "Job Cards",
    unit: "",
    target: 20,
    targetLabel: "20",
    icon: "📋",
    color: "text-green-400",
  },
  {
    key: "callbacks",
    label: "Callbacks",
    unit: "",
    target: 2,
    targetLabel: "< 2",
    icon: "📞",
    color: "text-red-400",
    lowerBetter: true,
  },
  {
    key: "timesheets_days",
    label: "Timesheets",
    unit: " days",
    target: 10,
    targetLabel: "10",
    icon: "🗓",
    color: "text-yellow-400",
  },
];

function kpiStatus(meta: KpiMeta, value: number, target: number): "good" | "ok" | "bad" {
  if (meta.lowerBetter) {
    if (value === 0) return "good";
    if (value <= target) return "good";
    if (value <= target + 1) return "ok";
    return "bad";
  }
  const ratio = value / target;
  if (ratio >= 1) return "good";
  if (ratio >= 0.85) return "ok";
  return "bad";
}

const STATUS_DOT: Record<string, string> = {
  good: "bg-green-400",
  ok: "bg-yellow-400",
  bad: "bg-red-400",
};

const STATUS_LABEL: Record<string, string> = {
  good: "On target ✓",
  ok: "Getting there",
};

interface Props {
  sparkyName: string;
  kpiEntry: KpiEntry | null;
  history: Pick<KpiEntry, "month" | "year" | "score" | "bonus_earned">[];
  currentMonth: number;
  currentYear: number;
  targets: Record<KpiType, number>;
  teamScore: number;
}

export default function SparkyDashboard({
  sparkyName,
  kpiEntry,
  history,
  currentMonth,
  currentYear,
  targets,
  teamScore,
}: Props) {
  const supabase = createClient();
  const [barWidth, setBarWidth] = useState(0);
  const animated = useRef(false);

  // Animate score bar on mount
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
    <div className="min-h-screen bg-bg pb-32 md:pb-12">
      {/* ── Desktop top nav ── */}
      <TopNav role="sparky" userName={sparkyName} onSignOut={signOut} />

      {/* ── Mobile header (hidden on desktop) ── */}
      <div className="md:hidden sticky top-0 z-30 bg-bg/80 backdrop-blur-xl border-b border-border px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-text-secondary">{monthLabel}</p>
            <h1 className="text-lg font-bold text-text-primary">{sparkyName}</h1>
          </div>
          <button
            onClick={signOut}
            className="text-xs text-text-secondary px-3 py-2 rounded-xl bg-surface border border-border active:opacity-70"
          >
            Sign out
          </button>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="px-4 pt-5 md:px-8 md:pt-8 md:max-w-5xl md:mx-auto space-y-4 md:space-y-0">

        {/* Desktop: 2-column layout. Mobile: stacked. */}
        <div className="md:grid md:grid-cols-5 md:gap-6 space-y-4 md:space-y-0">

          {/* ── Score card (left on desktop) ── */}
          <div className="md:col-span-2">
            {/* Month label — desktop only (mobile has the header) */}
            <p className="hidden md:block text-xs text-text-secondary uppercase tracking-widest mb-3 font-semibold">
              {monthLabel}
            </p>
            <div className="bg-surface border border-border rounded-2xl p-5 h-full">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-xs text-text-secondary uppercase tracking-widest mb-1">
                    Monthly score
                  </p>
                  {kpiEntry ? (
                    <div className="text-4xl font-bold text-brand">
                      {kpiEntry.score}
                      <span className="text-xl text-text-secondary font-normal">/100</span>
                    </div>
                  ) : (
                    <div className="text-4xl font-bold text-muted">
                      —
                      <span className="text-xl text-text-secondary font-normal">/100</span>
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-xs text-text-secondary mb-1">Bonus earned</p>
                  {kpiEntry ? (
                    <p className="text-2xl font-bold text-green-400">
                      ${Number(kpiEntry.bonus_earned).toFixed(0)}
                    </p>
                  ) : (
                    <p className="text-2xl font-bold text-muted">$—</p>
                  )}
                </div>
              </div>

              {/* Score bar */}
              <div className="h-2.5 bg-border rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${barWidth}%` }}
                />
              </div>

              {!kpiEntry && (
                <p className="text-xs text-muted mt-3 text-center">
                  Your admin enters KPI figures each month — check back soon.
                </p>
              )}
              <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
                <span className="text-xs uppercase tracking-widest text-text-secondary">Team score</span>
                <span className="text-lg font-semibold text-white">{teamScore.toFixed(1)}<span className="text-sm text-text-secondary">/100</span></span>
              </div>
              <NotificationPrompt />
            </div>
          </div>

          {/* ── KPI cards (right on desktop, 2×2 grid) ── */}
          <div className="md:col-span-3">
            {/* Spacer to align with score card label on desktop */}
            <p className="hidden md:block text-xs text-text-secondary uppercase tracking-widest mb-3 font-semibold opacity-0 select-none">
              KPIs
            </p>
            <div className="grid grid-cols-2 gap-3">
              {KPI_META.map((meta) => {
                const value = kpiEntry ? kpiEntry[meta.key] : null;
                const target = targets[meta.key];
                const status = value !== null ? kpiStatus(meta, value as number, target) : null;

                return (
                  <div
                    key={meta.key}
                    className="bg-surface border border-border rounded-2xl p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xl">{meta.icon}</span>
                      <div className="flex items-center gap-1.5">
                        {status && (
                          <span className={`w-2 h-2 rounded-full ${STATUS_DOT[status]}`} />
                        )}
                        <span className="text-xs text-muted">{meta.lowerBetter ? `< ${target}` : target}</span>
                      </div>
                    </div>
                    <div className={`text-2xl font-bold ${meta.color}`}>
                      {value !== null ? (
                        <>
                          {value}
                          {meta.unit}
                        </>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </div>
                    <p className="text-xs font-medium text-text-primary mt-1">{meta.label}</p>
                    {value !== null && status && (
                      <p className="text-xs text-muted mt-0.5">
                        {STATUS_LABEL[status] ??
                          (meta.lowerBetter ? "Above target" : "Below target")}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── History ── */}
        {history.length > 1 && (
          <div className="md:mt-6">
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-widest mb-3 mt-4 md:mt-0">
              Recent months
            </p>
            <div className="bg-surface border border-border rounded-2xl overflow-hidden divide-y divide-border">
              {history.map((h) => (
                <div
                  key={`${h.year}-${h.month}`}
                  className="flex items-center gap-3 px-4 py-3"
                >
                  <span className="text-xs text-text-secondary w-16 shrink-0">
                    {MONTHS[h.month - 1]} {h.year !== currentYear ? h.year : ""}
                  </span>
                  <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand rounded-full"
                      style={{ width: `${h.score}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-brand w-8 text-right shrink-0">
                    {h.score}
                  </span>
                  <span className="text-xs text-green-400 w-16 text-right shrink-0">
                    ${Number(h.bonus_earned).toFixed(0)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <BottomNav role="sparky" />
    </div>
  );
}
