import { formatKpi, kpisFor, mockKpi } from "@/lib/mockKpis";
import type { UserRole } from "@/lib/types";

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const pts = data
    .map((v, i) => `${(i / (data.length - 1)) * 100},${26 - ((v - min) / span) * 22 - 2}`)
    .join(" ");
  return (
    <svg viewBox="0 0 100 26" preserveAspectRatio="none" className="h-7 w-full" aria-hidden>
      <polyline points={pts} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

const STATUS = {
  good: { dot: "bg-green-400", bar: "bg-green-400", stroke: "#4ade80" },
  warn: { dot: "bg-yellow-400", bar: "bg-yellow-400", stroke: "#facc15" },
  bad: { dot: "bg-red-400", bar: "bg-red-400", stroke: "#f87171" },
};

// KPI cards for a role — value vs target, status, progress + trend sparkline.
// Data is placeholder for now (see lib/mockKpis).
export default function KpiDashboard({ role }: { role: UserRole }) {
  const defs = kpisFor(role);
  if (!defs.length) return null;
  return (
    <section className="mb-8">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">KPIs</h2>
        <span className="rounded-full border border-border px-2 py-0.5 text-[10px] uppercase tracking-widest text-text-secondary">Placeholder data</span>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {defs.map((def) => {
          const m = mockKpi(def);
          const s = STATUS[m.status];
          return (
            <div key={def.key} className="panel p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-xs font-medium text-text-secondary">{def.label}</p>
                <span className={`h-2 w-2 shrink-0 rounded-full ${s.dot}`} />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-white">{formatKpi(m.current, def.unit)}</span>
                <span className="text-xs text-muted">/ {formatKpi(def.target, def.unit)}</span>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div className={`h-full rounded-full ${s.bar}`} style={{ width: `${Math.max(4, Math.min(100, m.pct * 100))}%` }} />
              </div>
              <div className="mt-3">
                <Sparkline data={m.trend} color={s.stroke} />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
