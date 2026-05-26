"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { KpiEntry } from "@/lib/types";

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

function kpiStatus(meta: KpiMeta, value: number): "good" | "ok" | "bad" {
  if (meta.lowerBetter) {
    if (value === 0) return "good";
    if (value <= 1) return "good";
    if (value === 2) return "ok";
    return "bad";
  }
  const ratio = value / meta.target;
  if (ratio >= 1) return "good";
  if (ratio >= 0.85) return "ok";
  return "bad";
}

const STATUS_DOT: Record<string, string> = {
  good: "bg-green-400",
  ok: "bg-yellow-400",
  bad: "bg-red-400",
};

interface Props {
  sparkyName: string;
  kpiEntry: KpiEntry | null;
  history: Pick<KpiEntry, "month" | "year" | "score" | "bonus_earned">[];
  currentMonth: number;
  currentYear: number;
}

export default function SparkyDashboard({
  sparkyName,
  kpiEntry,
  history,
  currentMonth,
  currentYear,
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
    <div className="min-h-screen bg-bg pb-24">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-bg/80 backdrop-blur-xl border-b border-border px-4 py-4">
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

      <div className="px-4 pt-5 space-y-4">
        {/* Score card */}
        <div className="bg-surface border border-border rounded-2xl p-5">
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
                <div className="text-4xl font-bold text-text-muted">
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
                <p className="text-2xl font-bold text-text-muted">$—</p>
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
            <p className="text-xs text-text-muted mt-3 text-center">
              Your admin enters KPI figures each month — check back soon.
            </p>
          )}
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 gap-3">
          {KPI_META.map((meta) => {
            const value = kpiEntry ? kpiEntry[meta.key] : null;
            const status = value !== null ? kpiStatus(meta, value as number) : null;

            return (
              <div
                key={meta.key}
                className="bg-surface border border-border rounded-2xl p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xl">{meta.icon}</span>
                  <div className="flex items-center gap-1.5">
                    {status && (
                      <span
                        className={`w-2 h-2 rounded-full ${STATUS_DOT[status]}`}
                      />
                    )}
                    <span className="text-xs text-text-muted">
                      {meta.targetLabel}
                    </span>
                  </div>
                </div>
                <div className={`text-2xl font-bold ${meta.color}`}>
                  {value !== null ? (
                    <>
                      {value}
                      {meta.unit}
                    </>
                  ) : (
                    <span className="text-text-muted">—</span>
                  )}
                </div>
                <p className="text-xs font-medium text-text-primary mt-1">
                  {meta.label}
                </p>
                {value !== null && status && (
                  <p className="text-xs text-text-muted mt-0.5">
                    {status === "good"
                      ? "On target ✓"
                      : status === "ok"
                      ? "Getting there"
                      : meta.lowerBetter
                      ? "Above target"
                      : "Below target"}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* History */}
        {history.length > 1 && (
          <div>
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-widest mb-3">
              Recent months
            </p>
            <div className="bg-surface border border-border rounded-2xl overflow-hidden divide-y divide-border">
              {history.map((h) => (
                <div
                  key={`${h.year}-${h.month}`}
                  className="flex items-center gap-3 px-4 py-3"
                >
                  <span className="text-xs text-text-secondary w-12 shrink-0">
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
                  <span className="text-xs text-green-400 w-14 text-right shrink-0">
                    ${Number(h.bonus_earned).toFixed(0)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
