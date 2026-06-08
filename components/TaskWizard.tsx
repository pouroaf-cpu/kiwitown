"use client";

import { useState } from "react";
import { CADENCE_LABELS } from "@/lib/dailyChecks";
import type { CheckInputType, CheckItem, UserRole } from "@/lib/types";

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
  description: string;
  input_type: CheckInputType;
  target: string;
  unit: string;
  cadence: "daily" | "weekly" | "monthly";
  due_day: string;
  critical: boolean;
  due_time: string;
  alert_role: string;
  show_on_dashboard: boolean;
};

function formFrom(item: CheckItem | null): Form {
  return {
    label: item?.label ?? "",
    description: item?.description ?? "",
    input_type: item?.input_type ?? "yes_no",
    target: item?.target == null ? "" : String(item.target),
    unit: item?.unit ?? "",
    cadence: item?.cadence ?? "daily",
    due_day: item?.due_day == null ? "" : String(item.due_day),
    critical: item?.critical ?? false,
    due_time: item?.due_time ?? "",
    alert_role: item?.alert_role ?? "",
    show_on_dashboard: item?.show_on_dashboard ?? false,
  };
}

// Required fields (everything else is optional). due_time/alert_role only
// matter when the check is critical.
const REQUIRED = ["label", "due_time", "alert_role"] as const;
function missingOf(f: Form): string[] {
  const out: string[] = [];
  if (!f.label.trim()) out.push("label");
  if (f.critical && !f.due_time) out.push("due_time");
  if (f.critical && !f.alert_role) out.push("alert_role");
  return out;
}
function pageOf(field: string): 1 | 2 | 3 {
  if (field === "label" || field === "description") return 1;
  if (field === "input_type" || field === "target" || field === "unit") return 2;
  return 3;
}

export default function TaskWizard({
  role,
  item,
  onClose,
  onSaved,
}: {
  role: Exclude<UserRole, "super_admin">;
  item: CheckItem | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [page, setPage] = useState<1 | 2 | 3>(1);
  const [form, setForm] = useState<Form>(() => formFrom(item));
  const [errors, setErrors] = useState<Set<string>>(new Set());
  const [draftPrompt, setDraftPrompt] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  const set = (patch: Partial<Form>) => setForm((f) => ({ ...f, ...patch }));
  const glow = (field: string) =>
    errors.has(field) ? "ring-2 ring-red-500/80 shadow-[0_0_14px_rgba(239,68,68,0.45)]" : "";
  const showNumberOpts = form.input_type === "number" || form.input_type === "currency";

  async function doSave(draft: boolean) {
    setBusy(true);
    setNotice("");
    const payload = {
      role,
      label: form.label,
      description: form.description || null,
      input_type: form.input_type,
      target: form.target === "" ? null : Number(form.target),
      unit: form.unit || null,
      cadence: form.cadence,
      due_day: form.due_day === "" ? null : Number(form.due_day),
      critical: form.critical,
      due_time: form.critical && form.due_time ? form.due_time : null,
      alert_role: form.critical && form.alert_role ? form.alert_role : null,
      show_on_dashboard: form.show_on_dashboard,
      draft,
      ...(item ? { id: item.id } : {}),
    };
    const res = await fetch("/api/check-items", {
      method: item ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setBusy(false);
    setDraftPrompt(false);
    if (!res.ok) {
      setNotice(data.error || "Could not save.");
      return;
    }
    onSaved();
    onClose();
  }

  function onSave() {
    const missing = missingOf(form);
    if (missing.length === 0) {
      doSave(false);
      return;
    }
    setDraftPrompt(true);
  }

  function gotoMissing() {
    const missing = missingOf(form);
    setErrors(new Set(missing));
    setDraftPrompt(false);
    if (missing[0]) setPage(pageOf(missing[0]));
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-stretch justify-center bg-black/60 backdrop-blur-md sm:items-center sm:p-6">
      <div className="relative flex w-full max-w-lg flex-col bg-bg sm:max-h-[92vh] sm:rounded-3xl sm:border sm:border-border">
        {/* Header: X / Back · title · Save */}
        <div className="flex items-center justify-between border-b border-border px-3 py-3">
          <button
            type="button"
            onClick={() => (page === 1 ? onClose() : setPage((p) => (p - 1) as 1 | 2 | 3))}
            className="rounded-lg px-2 py-1 text-sm font-semibold text-text-secondary hover:text-white"
          >
            {page === 1 ? "✕" : "‹ Back"}
          </button>
          <span className="text-xs font-semibold uppercase tracking-widest text-text-secondary">
            {item ? "Edit task" : "New task"} · {page}/3
          </span>
          <button type="button" onClick={onSave} disabled={busy} className="rounded-lg px-2 py-1 text-sm font-semibold text-brand">
            {busy ? "…" : "Save"}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {page === 1 && (
            <div className="space-y-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand">Step 1</p>
                <h2 className="mt-1 text-xl font-semibold text-white">What is the check?</h2>
              </div>
              <label className="block text-xs uppercase tracking-widest text-text-secondary">
                Name
                <input
                  className={`field mt-2 ${glow("label")}`}
                  value={form.label}
                  onChange={(e) => set({ label: e.target.value })}
                  placeholder="e.g. Timesheet submitted"
                  autoFocus
                />
              </label>
              <label className="block text-xs uppercase tracking-widest text-text-secondary">
                Description (optional)
                <textarea
                  className="field mt-2 min-h-24 resize-y"
                  value={form.description}
                  onChange={(e) => set({ description: e.target.value })}
                  placeholder="What's it about? Any instructions for the person doing it."
                />
              </label>
            </div>
          )}

          {page === 2 && (
            <div className="space-y-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand">Step 2</p>
                <h2 className="mt-1 text-xl font-semibold text-white">What&apos;s the answer?</h2>
              </div>
              <label className="block text-xs uppercase tracking-widest text-text-secondary">
                Answer should be
                <select className="field mt-2" value={form.input_type} onChange={(e) => set({ input_type: e.target.value as CheckInputType })}>
                  {INPUT_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </label>
              {showNumberOpts && (
                <div className="grid grid-cols-2 gap-4">
                  <label className="block text-xs uppercase tracking-widest text-text-secondary">
                    Target (optional)
                    <input className="field mt-2" type="number" value={form.target} onChange={(e) => set({ target: e.target.value })} />
                  </label>
                  <label className="block text-xs uppercase tracking-widest text-text-secondary">
                    Unit (optional)
                    <input className="field mt-2" value={form.unit} onChange={(e) => set({ unit: e.target.value })} placeholder="% / $ / h" />
                  </label>
                </div>
              )}
            </div>
          )}

          {page === 3 && (
            <div className="space-y-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand">Step 3</p>
                <h2 className="mt-1 text-xl font-semibold text-white">How often?</h2>
              </div>
              <label className="block text-xs uppercase tracking-widest text-text-secondary">
                Frequency
                <select className="field mt-2" value={form.cadence} onChange={(e) => set({ cadence: e.target.value as Form["cadence"] })}>
                  {CADENCES.map((c) => (
                    <option key={c} value={c}>{CADENCE_LABELS[c]}</option>
                  ))}
                </select>
              </label>
              {form.cadence === "weekly" && (
                <label className="block text-xs uppercase tracking-widest text-text-secondary">
                  Day (optional)
                  <select className="field mt-2" value={form.due_day} onChange={(e) => set({ due_day: e.target.value })}>
                    <option value="">Any day this week</option>
                    {DAYS.map((d, i) => (
                      <option key={d} value={i + 1}>{d}</option>
                    ))}
                  </select>
                </label>
              )}
              <label className="flex items-center gap-3 text-sm text-white">
                <input type="checkbox" className="h-5 w-5 accent-brand" checked={form.critical} onChange={(e) => set({ critical: e.target.checked })} />
                Critical — text a manager if not done in time
              </label>
              {form.critical && (
                <div className="grid grid-cols-2 gap-4">
                  <label className="block text-xs uppercase tracking-widest text-text-secondary">
                    Due by
                    <input className={`field mt-2 ${glow("due_time")}`} type="time" value={form.due_time} onChange={(e) => set({ due_time: e.target.value })} />
                  </label>
                  <label className="block text-xs uppercase tracking-widest text-text-secondary">
                    Alert who
                    <select className={`field mt-2 ${glow("alert_role")}`} value={form.alert_role} onChange={(e) => set({ alert_role: e.target.value })}>
                      <option value="">—</option>
                      <option value="coo">COO</option>
                      <option value="foreman">Ops Manager</option>
                    </select>
                  </label>
                </div>
              )}
              <label className="flex items-center gap-3 text-sm text-white">
                <input type="checkbox" className="h-5 w-5 accent-brand" checked={form.show_on_dashboard} onChange={(e) => set({ show_on_dashboard: e.target.checked })} />
                Show on the dashboard
              </label>
              <p className="text-xs text-text-secondary">Reorder checks with the arrows on the list after saving.</p>
            </div>
          )}

          {notice && <p className="mt-4 text-sm text-red-300">{notice}</p>}
        </div>

        {page < 3 && (
          <div className="border-t border-border p-4">
            <button type="button" className="primary-button w-full" onClick={() => setPage((p) => (p + 1) as 1 | 2 | 3)}>
              Continue
            </button>
          </div>
        )}

        {/* Save-as-draft prompt */}
        {draftPrompt && (
          <div className="absolute inset-0 z-[110] flex items-center justify-center bg-black/60 p-6">
            <div className="w-full max-w-xs rounded-2xl border border-border bg-surface p-5 text-center">
              <p className="text-sm text-white">Some required fields are empty.</p>
              <p className="mt-1 text-xs text-text-secondary">Save it as a draft for now?</p>
              <div className="mt-4 flex flex-col gap-2">
                <button type="button" className="primary-button w-full" onClick={() => doSave(true)} disabled={busy}>Save as draft</button>
                <button type="button" className="secondary-button w-full" onClick={gotoMissing}>No, finish it</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
