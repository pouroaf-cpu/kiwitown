"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ROLE_LABELS, businessDate } from "@/lib/dailyChecks";
import type { UserRole } from "@/lib/types";

export interface TeamRow { role: UserRole; total: number; submitted: number }

// Anonymised team daily-check completion — overall % + per-role counts, never
// individual people. Data comes from the team_daily_completion RPC.
export default function TeamCompletion({ preview }: { preview?: TeamRow[] }) {
  const [rows, setRows] = useState<TeamRow[] | null>(preview ?? null);
  const [loading, setLoading] = useState(!preview);

  useEffect(() => {
    if (preview) return;
    const supabase = createClient();
    let active = true;
    (async () => {
      const { data } = await supabase.rpc("team_daily_completion", { p_date: businessDate() });
      if (active) {
        setRows((data ?? []) as TeamRow[]);
        setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [preview]);

  const all = rows ?? [];
  const total = all.reduce((s, r) => s + Number(r.total), 0);
  const submitted = all.reduce((s, r) => s + Number(r.submitted), 0);
  const pct = total ? Math.round((submitted / total) * 100) : 0;

  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-text-secondary">Team today</p>
          <p className="mt-1 text-sm text-white">Daily checks done</p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold text-brand">{loading ? "—" : `${pct}%`}</p>
          <p className="text-xs text-text-secondary">{submitted}/{total} in</p>
        </div>
      </div>
      <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-border">
        <div className="h-full rounded-full bg-brand transition-all duration-700" style={{ width: `${pct}%` }} />
      </div>
      {!loading && all.length > 0 && (
        <div className="mt-4 space-y-2">
          {all.map((r) => {
            const p = Number(r.total) ? Math.round((Number(r.submitted) / Number(r.total)) * 100) : 0;
            return (
              <div key={r.role} className="flex items-center gap-3 text-xs">
                <span className="w-28 shrink-0 text-text-secondary">{ROLE_LABELS[r.role]}</span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-border">
                  <div className="h-full rounded-full bg-brand/70" style={{ width: `${p}%` }} />
                </div>
                <span className="w-10 text-right text-white">{r.submitted}/{r.total}</span>
              </div>
            );
          })}
        </div>
      )}
      <p className="mt-3 text-xs text-muted">Team-wide only — individual results aren&apos;t shown here.</p>
    </div>
  );
}
