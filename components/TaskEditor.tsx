"use client";

import { useEffect, useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import TaskWizard from "@/components/TaskWizard";
import { createClient } from "@/lib/supabase/client";
import { CADENCE_LABELS, ROLE_LABELS } from "@/lib/dailyChecks";
import type { CheckInputType, CheckItem, UserRole } from "@/lib/types";

type EditableRole = Exclude<UserRole, "super_admin">;
const EDITABLE_ROLES: EditableRole[] = ["coo", "office_admin", "foreman", "sparky"];
const CADENCES = ["daily", "weekly", "monthly"] as const;
const TYPE_LABEL: Record<CheckInputType, string> = {
  yes_no: "Yes / No", number: "Number", currency: "$ Amount", date: "Date", time: "Time", text: "Text", photo: "Photo",
};

export default function TaskEditor({ navRole, userName }: { navRole: UserRole; userName: string }) {
  const supabase = useMemo(() => createClient(), []);
  const [role, setRole] = useState<EditableRole>("sparky");
  const [items, setItems] = useState<CheckItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [wizard, setWizard] = useState<{ item: CheckItem | null } | null>(null);

  async function load(r: EditableRole) {
    setLoading(true);
    const res = await fetch(`/api/check-items?role=${r}`);
    const data = await res.json();
    setItems((data.items ?? []) as CheckItem[]);
    setLoading(false);
  }
  useEffect(() => {
    load(role);
  }, [role]);

  async function remove(id: string) {
    const res = await fetch("/api/check-items", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) load(role);
  }

  // Move a check up/down within its cadence group (swaps order_index).
  async function move(cadence: string, index: number, dir: -1 | 1) {
    const group = items.filter((i) => i.cadence === cadence).sort((a, b) => a.order_index - b.order_index);
    const j = index + dir;
    if (j < 0 || j >= group.length) return;
    const a = group[index];
    const b = group[j];
    setItems((prev) =>
      prev.map((it) =>
        it.id === a.id ? { ...it, order_index: b.order_index } : it.id === b.id ? { ...it, order_index: a.order_index } : it
      )
    );
    await fetch("/api/check-items", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order: [{ id: a.id, order_index: b.order_index }, { id: b.id, order_index: a.order_index }] }),
    });
  }

  async function signOut() {
    await supabase.auth.signOut();
    window.location.assign("/login");
  }

  return (
    <AppShell role={navRole} userName={userName} onSignOut={signOut}>
      <div className="mx-auto max-w-3xl px-5 pb-28 md:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand">Task editor</p>
        <h1 className="mt-3 font-display text-4xl uppercase text-white md:text-5xl">Checklists</h1>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <label className="text-xs uppercase tracking-widest text-text-secondary">Role</label>
          <select className="field !w-auto" value={role} onChange={(e) => setRole(e.target.value as EditableRole)}>
            {EDITABLE_ROLES.map((r) => (
              <option key={r} value={r}>{ROLE_LABELS[r]}</option>
            ))}
          </select>
          <button className="primary-button ml-auto !w-auto" type="button" onClick={() => setWizard({ item: null })}>+ Add check</button>
        </div>

        {loading ? (
          <p className="mt-8 text-sm text-text-secondary">Loading…</p>
        ) : (
          <div className="mt-8 space-y-6">
            {CADENCES.map((c) => {
              const list = items.filter((i) => i.cadence === c).sort((a, b) => a.order_index - b.order_index);
              if (list.length === 0) return null;
              return (
                <section key={c}>
                  <p className="text-xs font-semibold uppercase tracking-widest text-text-secondary">{CADENCE_LABELS[c]}</p>
                  <div className="mt-3 divide-y divide-border overflow-hidden rounded-2xl border border-border">
                    {list.map((it, idx) => (
                      <div key={it.id} className="flex items-center gap-3 px-3 py-3">
                        <div className="flex flex-col text-text-secondary">
                          <button type="button" disabled={idx === 0} onClick={() => move(c, idx, -1)} className="leading-none disabled:opacity-20" aria-label="Move up">▲</button>
                          <button type="button" disabled={idx === list.length - 1} onClick={() => move(c, idx, 1)} className="leading-none disabled:opacity-20" aria-label="Move down">▼</button>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-white">
                            {it.label}
                            {it.draft && <span className="ml-2 rounded bg-yellow-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-yellow-300">DRAFT</span>}
                            {it.critical && <span className="ml-2 rounded bg-red-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-red-300">CRITICAL</span>}
                            {it.show_on_dashboard && <span className="ml-2 rounded bg-brand/20 px-1.5 py-0.5 text-[10px] font-semibold text-brand">DASH</span>}
                          </p>
                          <p className="text-xs text-text-secondary">
                            {TYPE_LABEL[it.input_type]}
                            {it.target != null && ` · target ${it.target}${it.unit ?? ""}`}
                          </p>
                        </div>
                        <button type="button" className="text-xs font-semibold text-brand" onClick={() => setWizard({ item: it })}>Edit</button>
                        <button type="button" className="text-xs font-semibold text-red-300" onClick={() => remove(it.id)}>Remove</button>
                      </div>
                    ))}
                  </div>
                </section>
              );
            })}
            {items.length === 0 && <p className="text-sm text-text-secondary">No checks yet — add one.</p>}
          </div>
        )}
      </div>

      {wizard && (
        <TaskWizard role={role} item={wizard.item} onClose={() => setWizard(null)} onSaved={() => load(role)} />
      )}
    </AppShell>
  );
}
