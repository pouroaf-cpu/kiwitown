"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import AppShell from "@/components/AppShell";
import DailyCheckSection from "@/components/DailyCheckSection";
import { CADENCES, CADENCE_LABELS, ROLE_LABELS, cadencesFor, type Cadence } from "@/lib/dailyChecks";
import type { UserRole } from "@/lib/types";

// A role's checklist — Daily / Weekly / Monthly tabs for the cadences that role
// has items for (read live from check_items, with the code config as fallback).
export default function ChecklistScreen({ role, userName }: { role: UserRole; userName: string }) {
  const supabase = useMemo(() => createClient(), []);
  const [cadences, setCadences] = useState<Cadence[]>(cadencesFor(role));
  const [cadence, setCadence] = useState<Cadence>(cadencesFor(role)[0] ?? "daily");

  useEffect(() => {
    fetch(`/api/check-items?role=${role}`)
      .then((r) => r.json())
      .then((d) => {
        const items = (d.items ?? []) as { cadence: Cadence }[];
        const cs = CADENCES.filter((c) => items.some((i) => i.cadence === c));
        const list = cs.length ? cs : cadencesFor(role);
        setCadences(list);
        setCadence((prev) => (list.includes(prev) ? prev : list[0] ?? "daily"));
      })
      .catch(() => {});
  }, [role]);

  async function signOut() {
    await supabase.auth.signOut();
    window.location.assign("/login");
  }

  return (
    <AppShell role={role} userName={userName} onSignOut={signOut}>
      <div className="mx-auto max-w-5xl px-5 pb-28 md:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand">Checklist</p>
        <h1 className="mt-3 font-display text-4xl uppercase text-white md:text-5xl">{ROLE_LABELS[role]}</h1>

        {cadences.length > 1 && (
          <div className="mt-6 inline-flex gap-1 rounded-xl border border-border bg-black/20 p-1">
            {cadences.map((c) => (
              <button
                key={c}
                onClick={() => setCadence(c)}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  cadence === c ? "bg-brand text-background" : "text-text-secondary hover:text-white"
                }`}
              >
                {CADENCE_LABELS[c]}
              </button>
            ))}
          </div>
        )}

        {cadences.length === 0 ? (
          <p className="mt-8 text-sm text-text-secondary">No checklist items for this role yet.</p>
        ) : (
          <div className="mt-8">
            <DailyCheckSection key={cadence} role={role} cadence={cadence} />
          </div>
        )}
      </div>
    </AppShell>
  );
}
