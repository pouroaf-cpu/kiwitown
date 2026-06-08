"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import { createClient } from "@/lib/supabase/client";
import { CADENCE_LABELS, ROLE_LABELS } from "@/lib/dailyChecks";
import type { CheckInputType, CheckItem, UserRole } from "@/lib/types";

type EditableRole = Exclude<UserRole, "super_admin">;
const EDITABLE_ROLES: EditableRole[] = ["coo", "office_admin", "foreman", "sparky"];
const INPUT_TYPES: { value: CheckInputType; label: string }[] = [
  { value: "yes_no", label: "Yes / No" },
  { value: "number", label: "Number" },
  { value: "currency", label: "$ Amount" },
  { value: "date", label: "Date" },
  { value: "time", label: "Time" },
  { value: "text", label: "Text" },
  { value: "photo", label: "Photo (coming soon)" },
];
const CADENCES = ["daily", "weekly", "monthly"] as const;
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

type Form = {
  label: string;
  input_type: CheckInputType;
  cadence: "daily" | "weekly" | "monthly";
  target: string;
  unit: string;
  due_day: string;
  critical: boolean;
  due_time: string;
  alert_role: string;
  show_on_dashboard: boolean;
};
const BLANK: Form = {
  label: "", input_type: "yes_no", cadence: "daily", target: "", unit: "",
  due_day: "", critical: false, due_time: "", alert_role: "", show_on_dashboard: false,
};

export default function TaskEditor({ navRole, userName }: { navRole: UserRole; userName: string }) {
  const supabase = useMemo(() => createClient(), []);
  const [role, setRole] = useState<EditableRole>("sparky");
  const [items, setItems] = useState<CheckItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null); // item id, "new", or null
  const [form, setForm] = useState<Form>(BLANK);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

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

  function startNew() {
    setForm(BLANK);
    setEditing("new");
    setNotice("");
  }
  function startEdit(it: CheckItem) {
    setForm({
      label: it.label, input_type: it.input_type, cadence: it.cadence,
      target: it.target == null ? "" : String(it.target), unit: it.unit ?? "",
      due_day: it.due_day == null ? "" : String(it.due_day), critical: it.critical,
      due_time: it.due_time ?? "", alert_role: it.alert_role ?? "", show_on_dashboard: it.show_on_dashboard,
    });
    setEditing(it.id);
    setNotice("");
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setNotice("");
    const payload = {
      role,
      label: form.label,
      input_type: form.input_type,
      cadence: form.cadence,
      target: form.target === "" ? null : Number(form.target),
      unit: form.unit || null,
      due_day: form.due_day === "" ? null : Number(form.due_day),
      critical: form.critical,
      due_time: form.critical && form.due_time ? form.due_time : null,
      alert_role: form.critical && form.alert_role ? form.alert_role : null,
      show_on_dashboard: form.show_on_dashboard,
      ...(editing !== "new" ? { id: editing } : {}),
    };
    const res = await fetch("/api/check-items", {
      method: editing === "new" ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setNotice(data.error || "Could not save.");
      return;
    }
    setEditing(null);
    setNotice("Saved.");
    load(role);
  }

  async function remove(id: string) {
    const res = await fetch("/api/check-items", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) load(role);
  }

  async function signOut() {
    await supabase.auth.signOut();
    window.location.assign("/login");
  }

  const showNumberOpts = form.input_type === "number" || form.input_type === "currency";

  return (
    <AppShell role={navRole} userName={userName} onSignOut={signOut}>
      <div className="mx-auto max-w-3xl px-5 pb-28 md:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand">Task editor</p>
        <h1 className="mt-3 font-display text-4xl uppercase text-white md:text-5xl">Checklists</h1>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <label className="text-xs uppercase tracking-widest text-text-secondary">Role</label>
          <select className="field !w-auto" value={role} onChange={(e) => { setEditing(null); setRole(e.target.value as EditableRole); }}>
            {EDITABLE_ROLES.map((r) => (
              <option key={r} value={r}>{ROLE_LABELS[r]}</option>
            ))}
          </select>
          <button className="primary-button ml-auto !w-auto" onClick={startNew} type="button">+ Add check</button>
        </div>

        {notice && <p className="mt-4 rounded-xl border border-brand/20 bg-brand/10 p-3 text-sm text-brand">{notice}</p>}

        {editing && (
          <form onSubmit={save} className="panel mt-5 space-y-4 p-5">
            <h2 className="text-lg font-semibold text-white">{editing === "new" ? "New check" : "Edit check"}</h2>
            <label className="block text-xs uppercase tracking-widest text-text-secondary">
              What is the check?
              <input className="field mt-2" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="e.g. Timesheet submitted" required />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-xs uppercase tracking-widest text-text-secondary">
                Answer should be
                <select className="field mt-2" value={form.input_type} onChange={(e) => setForm({ ...form, input_type: e.target.value as CheckInputType })}>
                  {INPUT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </label>
              <label className="block text-xs uppercase tracking-widest text-text-secondary">
                Frequency
                <select className="field mt-2" value={form.cadence} onChange={(e) => setForm({ ...form, cadence: e.target.value as Form["cadence"] })}>
                  {CADENCES.map((c) => <option key={c} value={c}>{CADENCE_LABELS[c]}</option>)}
                </select>
              </label>
            </div>
            {form.cadence === "weekly" && (
              <label className="block text-xs uppercase tracking-widest text-text-secondary">
                Day (optional)
                <select className="field mt-2" value={form.due_day} onChange={(e) => setForm({ ...form, due_day: e.target.value })}>
                  <option value="">Any day this week</option>
                  {DAYS.map((d, i) => <option key={d} value={i + 1}>{d}</option>)}
                </select>
              </label>
            )}
            {showNumberOpts && (
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-xs uppercase tracking-widest text-text-secondary">
                  Target (optional)
                  <input className="field mt-2" type="number" value={form.target} onChange={(e) => setForm({ ...form, target: e.target.value })} />
                </label>
                <label className="block text-xs uppercase tracking-widest text-text-secondary">
                  Unit (optional)
                  <input className="field mt-2" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="% / $ / h" />
                </label>
              </div>
            )}
            <label className="flex items-center gap-3 text-sm text-white">
              <input type="checkbox" className="h-5 w-5 accent-brand" checked={form.critical} onChange={(e) => setForm({ ...form, critical: e.target.checked })} />
              Critical — text a manager if not done by a time
            </label>
            {form.critical && (
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-xs uppercase tracking-widest text-text-secondary">
                  Due by
                  <input className="field mt-2" type="time" value={form.due_time} onChange={(e) => setForm({ ...form, due_time: e.target.value })} />
                </label>
                <label className="block text-xs uppercase tracking-widest text-text-secondary">
                  Alert who
                  <select className="field mt-2" value={form.alert_role} onChange={(e) => setForm({ ...form, alert_role: e.target.value })}>
                    <option value="">—</option>
                    <option value="coo">COO</option>
                    <option value="foreman">Ops Manager</option>
                  </select>
                </label>
              </div>
            )}
            <label className="flex items-center gap-3 text-sm text-white">
              <input type="checkbox" className="h-5 w-5 accent-brand" checked={form.show_on_dashboard} onChange={(e) => setForm({ ...form, show_on_dashboard: e.target.checked })} />
              Show on the dashboard
            </label>
            <div className="flex gap-3">
              <button className="primary-button !w-auto" disabled={busy} type="submit">{busy ? "Saving…" : "Save"}</button>
              <button className="secondary-button !w-auto" type="button" onClick={() => setEditing(null)}>Cancel</button>
            </div>
          </form>
        )}

        {loading ? (
          <p className="mt-8 text-sm text-text-secondary">Loading…</p>
        ) : (
          <div className="mt-8 space-y-6">
            {CADENCES.map((c) => {
              const list = items.filter((i) => i.cadence === c);
              if (list.length === 0) return null;
              return (
                <section key={c}>
                  <p className="text-xs font-semibold uppercase tracking-widest text-text-secondary">{CADENCE_LABELS[c]}</p>
                  <div className="mt-3 divide-y divide-border overflow-hidden rounded-2xl border border-border">
                    {list.map((it) => (
                      <div key={it.id} className="flex items-center justify-between gap-3 px-4 py-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-white">
                            {it.label}
                            {it.critical && <span className="ml-2 rounded bg-red-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-red-300">CRITICAL</span>}
                            {it.show_on_dashboard && <span className="ml-2 rounded bg-brand/20 px-1.5 py-0.5 text-[10px] font-semibold text-brand">DASH</span>}
                          </p>
                          <p className="text-xs text-text-secondary">
                            {INPUT_TYPES.find((t) => t.value === it.input_type)?.label}
                            {it.target != null && ` · target ${it.target}${it.unit ?? ""}`}
                          </p>
                        </div>
                        <div className="flex shrink-0 gap-2">
                          <button className="text-xs font-semibold text-brand" onClick={() => startEdit(it)}>Edit</button>
                          <button className="text-xs font-semibold text-red-300" onClick={() => remove(it.id)}>Remove</button>
                        </div>
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
    </AppShell>
  );
}
