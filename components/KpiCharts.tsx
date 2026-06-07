"use client";

import { useMemo, useState } from "react";
import type { KpiEntry, KpiType } from "@/lib/types";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

type Period = "3m" | "6m" | "12m" | "ytd";
const PERIODS: { id: Period; label: string }[] = [
  { id: "3m", label: "3M" },
  { id: "6m", label: "6M" },
  { id: "12m", label: "12M" },
  { id: "ytd", label: "YTD" },
];

const KPI_META: {
  key: keyof Pick<KpiEntry, "charge_out" | "job_cards" | "callbacks" | "timesheets_days">;
  label: string;
  unit: string;
  target: KpiType;
  lowerBetter?: boolean;
  color: string;
}[] = [
  { key: "charge_out", label: "Charge out", unit: "%", target: "charge_out", color: "#00AEEF" },
  { key: "job_cards", label: "Job cards", unit: "", target: "job_cards", color: "#2ECC71" },
  { key: "callbacks", label: "Callbacks", unit: "", target: "callbacks", lowerBetter: true, color: "#F87171" },
  { key: "timesheets_days", label: "Timesheets", unit: "d", target: "timesheets_days", color: "#FBBF24" },
];

export default function KpiCharts({
  entries,
  targets,
  currentYear,
}: {
  entries: KpiEntry[];
  targets: Record<KpiType, number>;
  currentYear: number;
}) {
  const [period, setPeriod] = useState<Period>("6m");

  const sorted = useMemo(
    () => [...entries].sort((a, b) => a.year - b.year || a.month - b.month),
    [entries]
  );
  const filtered = useMemo(() => {
    if (period === "ytd") return sorted.filter((e) => e.year === currentYear);
    const n = period === "3m" ? 3 : period === "6m" ? 6 : 12;
    return sorted.slice(-n);
  }, [sorted, period, currentYear]);

  const avgScore = filtered.length ? filtered.reduce((s, e) => s + Number(e.score), 0) / filtered.length : 0;
  const totalBonus = filtered.reduce((s, e) => s + Number(e.bonus_earned), 0);
  const best = filtered.length ? Math.max(...filtered.map((e) => Number(e.score))) : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-widest text-text-secondary">KPI trends</p>
        <div className="flex gap-1 rounded-xl border border-border bg-black/20 p-1">
          {PERIODS.map((p) => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                period === p.id ? "bg-brand text-background" : "text-text-secondary hover:text-white"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Avg score" value={avgScore.toFixed(0)} sub="/100" />
        <Stat label="Bonus" value={`$${totalBonus.toFixed(0)}`} />
        <Stat label="Months" value={`${filtered.length}`} />
        <Stat label="Best" value={`${best}`} sub="/100" />
      </div>

      <div className="rounded-2xl border border-border bg-surface p-5">
        <p className="mb-4 text-xs uppercase tracking-widest text-text-secondary">Monthly score</p>
        {filtered.length === 0 ? (
          <p className="text-sm text-text-secondary">No KPI data for this period yet.</p>
        ) : (
          <div className="flex h-40 gap-2">
            {filtered.map((e) => {
              const h = Math.max(2, (Number(e.score) / 100) * 100);
              return (
                <div key={`${e.year}-${e.month}`} className="flex flex-1 flex-col items-center gap-1.5">
                  <div className="flex w-full flex-1 items-end justify-center">
                    <div
                      className="w-full max-w-10 rounded-t-md bg-brand/80 transition-all"
                      style={{ height: `${h}%` }}
                      title={`${MONTHS[e.month - 1]} ${e.year}: ${e.score}/100`}
                    />
                  </div>
                  <span className="text-[10px] text-text-secondary">{MONTHS[e.month - 1]}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {KPI_META.map((m) => {
          const vals = filtered.map((e) => Number(e[m.key]));
          const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
          const target = targets[m.target];
          return (
            <div key={m.key} className="rounded-2xl border border-border bg-surface p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-text-primary">{m.label}</p>
                <span className="text-[10px] text-muted">
                  {m.lowerBetter ? `< ${target}` : target}
                  {m.unit}
                </span>
              </div>
              <p className="mt-1 text-2xl font-bold" style={{ color: m.color }}>
                {avg.toFixed(m.key === "charge_out" ? 0 : 1)}
                {m.unit}
              </p>
              <Sparkline values={vals} color={m.color} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <p className="text-[10px] uppercase tracking-widest text-text-secondary">{label}</p>
      <p className="mt-1 text-xl font-bold text-white">
        {value}
        {sub && <span className="text-xs font-normal text-text-secondary">{sub}</span>}
      </p>
    </div>
  );
}

function Sparkline({ values, color }: { values: number[]; color: string }) {
  if (values.length < 2) return <div className="mt-2 h-8" />;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const pts = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * 100;
      const y = 100 - ((v - min) / range) * 100;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="mt-2 h-8 w-full">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="3" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
