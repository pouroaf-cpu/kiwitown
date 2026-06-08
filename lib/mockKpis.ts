import type { UserRole } from "@/lib/types";

// Placeholder KPI set per role. Targets are made up for now (incl. the COO's
// $25k profit/person) — swap in real figures later. Values + trends are mocked
// deterministically (seeded off the key) so they're stable across renders and
// don't cause hydration mismatches.

export type KpiUnit = "$" | "%" | "h" | "";

export interface KpiDef {
  key: string;
  label: string;
  target: number;
  unit: KpiUnit;
  goodHigh?: boolean; // default true; false = lower is better (callbacks, debt)
}

export const KPIS_BY_ROLE: Record<UserRole, KpiDef[]> = {
  coo: [
    { key: "profit_per_person", label: "Profit / person", target: 25000, unit: "$" },
    { key: "revenue_week", label: "Revenue (week)", target: 25000, unit: "$" },
    { key: "gross_margin", label: "Gross margin / job", target: 40, unit: "%" },
    { key: "conversion", label: "Quote → job", target: 40, unit: "%" },
    { key: "staff_util", label: "Staff utilisation", target: 85, unit: "%" },
    { key: "cash", label: "Cash position", target: 120000, unit: "$" },
    { key: "outstanding_quotes", label: "Outstanding quotes", target: 80000, unit: "$" },
    { key: "callbacks_month", label: "Callbacks (month)", target: 2, unit: "", goodHigh: false },
  ],
  foreman: [
    { key: "labour_util", label: "Labour utilisation", target: 85, unit: "%" },
    { key: "on_time", label: "Jobs on time", target: 90, unit: "%" },
    { key: "callbacks_week", label: "Callbacks (week)", target: 2, unit: "", goodHigh: false },
    { key: "materials_on_time", label: "Materials on time", target: 95, unit: "%" },
    { key: "wip", label: "WIP value", target: 60000, unit: "$" },
    { key: "jobs_scheduled", label: "Jobs scheduled", target: 24, unit: "" },
  ],
  office_admin: [
    { key: "invoices_day", label: "Invoices sent (day)", target: 5, unit: "" },
    { key: "quotes_week", label: "Quotes sent (week)", target: 10, unit: "" },
    { key: "aged_receivables", label: "Aged receivables", target: 15000, unit: "$", goodHigh: false },
    { key: "timesheets_in", label: "Timesheets in", target: 100, unit: "%" },
    { key: "quote_followups", label: "Quote follow-ups", target: 12, unit: "" },
  ],
  sparky: [
    { key: "charge_out", label: "Charge-out hrs", target: 160, unit: "h" },
    { key: "job_cards", label: "Job cards", target: 80, unit: "" },
    { key: "callbacks", label: "Callbacks", target: 1, unit: "", goodHigh: false },
    { key: "timesheets_on_time", label: "Timesheets on time", target: 100, unit: "%" },
  ],
  // super_admin gets the company (COO) view.
  super_admin: [],
};

export function kpisFor(role: UserRole): KpiDef[] {
  if (role === "super_admin") return KPIS_BY_ROLE.coo;
  return KPIS_BY_ROLE[role] ?? [];
}

function seed(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function rng(s: number): () => number {
  let state = s;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface MockKpi { current: number; trend: number[]; pct: number; status: "good" | "warn" | "bad" }

// Deterministic mock current value + 6-point trend for a KPI.
export function mockKpi(def: KpiDef): MockKpi {
  const r = rng(seed(def.key));
  const ratio = 0.72 + r() * 0.4; // 72%–112% of target
  const current = Math.round(def.target * ratio);
  const trend = Array.from({ length: 6 }, () => Math.round(def.target * (0.6 + r() * 0.55)));
  trend[5] = current;
  const goodHigh = def.goodHigh !== false;
  const pct = def.target === 0 ? 1 : current / def.target;
  const ok = goodHigh ? pct >= 0.95 : pct <= 1.05;
  const near = goodHigh ? pct >= 0.8 : pct <= 1.3;
  return { current, trend, pct: goodHigh ? pct : 2 - pct, status: ok ? "good" : near ? "warn" : "bad" };
}

export function formatKpi(value: number, unit: KpiUnit): string {
  if (unit === "$") {
    if (value >= 100000) return `$${Math.round(value / 1000)}k`;
    if (value >= 1000) return `$${(value / 1000).toFixed(1)}k`;
    return `$${value}`;
  }
  if (unit === "%") return `${value}%`;
  if (unit === "h") return `${value}h`;
  return `${value}`;
}
