"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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

type Drag = { cadence: string; ids: string[]; activeId: string };

export default function TaskEditor({ navRole, userName }: { navRole: UserRole; userName: string }) {
  const supabase = useMemo(() => createClient(), []);
  const [role, setRole] = useState<EditableRole>("sparky");
  const [items, setItems] = useState<CheckItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [wizard, setWizard] = useState<{ item: CheckItem | null } | null>(null);
  const [drag, setDrag] = useState<Drag | null>(null);
  const rowRefs = useRef<Map<string, HTMLElement>>(new Map());

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

  // Order of a cadence group — the live drag order while dragging, else stored.
  function orderedIds(cadence: string): string[] {
    if (drag && drag.cadence === cadence) return drag.ids;
    return items.filter((i) => i.cadence === cadence).sort((a, b) => a.order_index - b.order_index).map((i) => i.id);
  }

  function onDragStart(e: React.PointerEvent, cadence: string, id: string) {
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setDrag({ cadence, ids: orderedIds(cadence), activeId: id });
  }

  function onDragMove(e: React.PointerEvent) {
    if (!drag) return;
    const y = e.clientY;
    const ids = drag.ids;
    const from = ids.indexOf(drag.activeId);
    let to = ids.length - 1;
    for (let k = 0; k < ids.length; k++) {
      const el = rowRefs.current.get(ids[k]);
      if (!el) continue;
      const r = el.getBoundingClientRect();
      if (y < r.top + r.height / 2) { to = k; break; }
    }
    if (to !== from) {
      const next = [...ids];
      next.splice(from, 1);
      next.splice(to, 0, drag.activeId);
      setDrag({ ...drag, ids: next });
    }
  }

  async function onDragEnd() {
    if (!drag) return;
    const order = drag.ids.map((id, idx) => ({ id, order_index: (idx + 1) * 10 }));
    setItems((prev) => prev.map((it) => {
      const o = order.find((x) => x.id === it.id);
      return o ? { ...it, order_index: o.order_index } : it;
    }));
    setDrag(null);
    await fetch("/api/check-items", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order }),
    });
  }

  async function signOut() {
    await supabase.auth.signOut();
    window.location.assign("/login");
  }

  const byId = new Map(items.map((i) => [i.id, i]));

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
              const ids = orderedIds(c);
              if (ids.length === 0) return null;
              return (
                <section key={c}>
                  <p className="text-xs font-semibold uppercase tracking-widest text-text-secondary">{CADENCE_LABELS[c]}</p>
                  <div className="mt-3 overflow-hidden rounded-2xl border border-border">
                    {ids.map((id) => {
                      const it = byId.get(id);
                      if (!it) return null;
                      const active = drag?.activeId === id;
                      return (
                        <div
                          key={id}
                          ref={(el) => { if (el) rowRefs.current.set(id, el); else rowRefs.current.delete(id); }}
                          className={`flex select-none items-center gap-3 border-b border-border px-2 py-3 transition-shadow ${
                            active ? "relative z-10 scale-[1.01] bg-surface shadow-xl ring-1 ring-brand" : "bg-transparent"
                          }`}
                        >
                          <button
                            type="button"
                            aria-label="Drag to reorder"
                            draggable={false}
                            onPointerDown={(e) => onDragStart(e, c, id)}
                            onPointerMove={onDragMove}
                            onPointerUp={onDragEnd}
                            onPointerCancel={onDragEnd}
                            onContextMenu={(e) => e.preventDefault()}
                            style={{ touchAction: "none", userSelect: "none", WebkitUserSelect: "none", WebkitTouchCallout: "none" }}
                            className="cursor-grab select-none px-1.5 text-text-secondary active:cursor-grabbing"
                          >
                            <svg width="14" height="20" viewBox="0 0 14 20" fill="currentColor" aria-hidden="true">
                              <circle cx="4" cy="4" r="1.5" /><circle cx="10" cy="4" r="1.5" />
                              <circle cx="4" cy="10" r="1.5" /><circle cx="10" cy="10" r="1.5" />
                              <circle cx="4" cy="16" r="1.5" /><circle cx="10" cy="16" r="1.5" />
                            </svg>
                          </button>
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
                      );
                    })}
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
