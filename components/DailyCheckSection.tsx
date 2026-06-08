"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CADENCE_LABELS,
  ROLE_LABELS,
  checkFieldsFor,
  type Cadence,
} from "@/lib/dailyChecks";
import { createClient } from "@/lib/supabase/client";
import type { CheckInputType, CheckItem, DailyCheckWithProfile, DailyValue, UserRole } from "@/lib/types";

interface RosterPerson { id: string; name: string; email: string; role: UserRole }
export interface DailyStatusRow { profile_id: string; name: string; role: UserRole; submitted: boolean }
export interface DailyData {
  profileId: string;
  role: UserRole;
  date: string;
  checks: DailyCheckWithProfile[];
  roster: RosterPerson[];
  items?: CheckItem[];
  statusRows?: DailyStatusRow[];
}

type Field = { key: string; label: string; input: CheckInputType; target: number | null; unit: string | null };

// Fields for a role: DB check_items when available, else the code config (used
// in the no-auth preview). The item id is the value key.
function fieldsFor(items: CheckItem[] | undefined, role: UserRole, cadence: Cadence): Field[] {
  if (items && items.length) {
    return items
      .filter((i) => i.role === role)
      .map((i) => ({ key: i.id, label: i.label, input: i.input_type, target: i.target, unit: i.unit }));
  }
  return checkFieldsFor(role, cadence).map((f) => ({
    key: f.key,
    label: f.label,
    input: f.type === "boolean" ? "yes_no" : "number",
    target: f.target ?? null,
    unit: f.unit ?? null,
  }));
}

function blankValue(input: CheckInputType): DailyValue {
  if (input === "yes_no") return false;
  if (input === "number" || input === "currency") return 0;
  return "";
}
function blankValues(fields: Field[]): Record<string, DailyValue> {
  const out: Record<string, DailyValue> = {};
  for (const f of fields) out[f.key] = blankValue(f.input);
  return out;
}
function answered(f: Field, v: DailyValue | undefined): boolean {
  if (f.input === "yes_no") return v === true;
  if (f.input === "number" || f.input === "currency") return typeof v === "number";
  return typeof v === "string" && v !== "";
}

function rollupModeFor(role: UserRole): "values" | "status" | "none" {
  if (role === "super_admin" || role === "foreman") return "values";
  if (role === "coo") return "status";
  return "none";
}

export default function DailyCheckSection({
  role,
  preview,
  cadence = "daily",
}: {
  role: UserRole;
  preview?: DailyData;
  cadence?: Cadence;
}) {
  const [data, setData] = useState<DailyData | null>(preview ?? null);
  const [statusRows, setStatusRows] = useState<DailyStatusRow[]>(preview?.statusRows ?? []);
  const [loading, setLoading] = useState(!preview);
  const [values, setValues] = useState<Record<string, DailyValue>>({});
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const supabase = useMemo(() => createClient(), []);
  const [uploading, setUploading] = useState<string | null>(null);

  const fields = useMemo(() => fieldsFor(data?.items, role, cadence), [data, role, cadence]);

  function seedFrom(d: DailyData) {
    const f = fieldsFor(d.items, role, cadence);
    const own = d.checks.find((c) => c.profile_id === d.profileId);
    setValues({ ...blankValues(f), ...(own?.values ?? {}) });
    setNote(own?.note ?? "");
  }

  useEffect(() => {
    if (preview) {
      seedFrom(preview);
      return;
    }
    let active = true;
    (async () => {
      try {
        const [res, statusRes] = await Promise.all([
          fetch(`/api/daily-check?cadence=${cadence}`),
          cadence === "daily" && role === "coo" ? fetch("/api/daily-check/status") : Promise.resolve(null),
        ]);
        if (!res.ok) throw new Error("load");
        const d = (await res.json()) as DailyData;
        if (!active) return;
        setData(d);
        seedFrom(d);
        if (statusRes && statusRes.ok) {
          const s = (await statusRes.json()) as { status: DailyStatusRow[] };
          if (active) setStatusRows(s.status ?? []);
        }
      } catch {
        if (active) setNotice("Couldn't load the checklist.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preview, role, cadence]);

  async function submit() {
    if (preview) {
      setNotice("Preview — saving is disabled here.");
      return;
    }
    setSaving(true);
    setNotice("");
    try {
      const res = await fetch("/api/daily-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ values, note, cadence }),
      });
      const saved = await res.json();
      if (!res.ok) throw new Error(saved.error || "save");
      setData((prev) => {
        if (!prev) return prev;
        const others = prev.checks.filter((c) => c.profile_id !== prev.profileId);
        const ownProfile = prev.roster.find((p) => p.id === prev.profileId) ?? null;
        return {
          ...prev,
          checks: [...others, { ...saved, profile: ownProfile ? { name: ownProfile.name, email: ownProfile.email, role: ownProfile.role } : null }],
        };
      });
      setNotice("Saved.");
    } catch (e) {
      setNotice(e instanceof Error && e.message !== "save" ? e.message : "Could not save.");
    } finally {
      setSaving(false);
    }
  }

  async function uploadPhoto(key: string, file: File) {
    if (preview) return;
    setUploading(key);
    try {
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const path = `${data?.profileId ?? "anon"}/${cadence}/${key}.${ext}`;
      const { error } = await supabase.storage.from("check-photos").upload(path, file, { upsert: true, contentType: file.type });
      if (error) throw error;
      const { data: pub } = supabase.storage.from("check-photos").getPublicUrl(path);
      setValues((v) => ({ ...v, [key]: pub.publicUrl }));
    } catch {
      setNotice("Photo upload failed.");
    } finally {
      setUploading(null);
    }
  }

  const dateLabel = data?.date ?? "";
  const mode = cadence === "daily" ? rollupModeFor(role) : "none";
  const periodLabel = cadence === "daily" ? "Today" : cadence === "weekly" ? "This week" : "This month";
  const checksByProfile = new Map((data?.checks ?? []).map((c) => [c.profile_id, c]));

  const rosterRows = (data?.roster ?? [])
    .filter((p) => p.id !== data?.profileId)
    .filter((p) => (role === "foreman" ? p.role === "sparky" : true));
  const submittedCount = rosterRows.filter((p) => checksByProfile.has(p.id)).length;

  const statusBoard = statusRows.filter((p) => p.profile_id !== data?.profileId);
  const statusSubmitted = statusBoard.filter((p) => p.submitted).length;

  return (
    <section className="mb-6 grid gap-5 lg:grid-cols-2">
      {fields.length > 0 && (
        <div className="panel p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">{CADENCE_LABELS[cadence]} check</p>
              <h3 className="mt-1 text-lg font-semibold text-white">{periodLabel} · {dateLabel}</h3>
            </div>
            <span className="text-xs text-text-secondary">{ROLE_LABELS[role]}</span>
          </div>

          {loading ? (
            <p className="mt-5 text-sm text-text-secondary">Loading…</p>
          ) : (
            <>
              <div className="mt-4 space-y-2.5">
                {fields.map((f) =>
                  f.input === "yes_no" ? (
                    <button
                      key={f.key}
                      type="button"
                      onClick={() => setValues((v) => ({ ...v, [f.key]: !v[f.key] }))}
                      className="flex w-full items-center justify-between rounded-xl border border-border bg-surface px-4 py-3 text-left"
                    >
                      <span className="text-sm text-white">{f.label}</span>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${values[f.key] ? "bg-brand text-background" : "bg-black/30 text-text-secondary"}`}>
                        {values[f.key] ? "Yes" : "No"}
                      </span>
                    </button>
                  ) : (
                    <label key={f.key} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface px-4 py-2.5">
                      <span className="text-sm text-white">
                        {f.label}
                        {f.target != null && <span className="ml-2 text-xs text-muted">target {f.target}{f.unit ?? ""}</span>}
                      </span>
                      {f.input === "number" || f.input === "currency" ? (
                        <input
                          type="number"
                          min={0}
                          inputMode="numeric"
                          className="w-24 rounded-lg border border-border bg-bg px-2 py-1.5 text-right text-sm text-white"
                          value={Number(values[f.key] ?? 0)}
                          onChange={(e) => setValues((v) => ({ ...v, [f.key]: Math.max(0, Number(e.target.value) || 0) }))}
                        />
                      ) : f.input === "photo" ? (
                        <div className="flex items-center gap-2">
                          {typeof values[f.key] === "string" && values[f.key] ? (
                            <a href={String(values[f.key])} target="_blank" rel="noreferrer">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={String(values[f.key])} alt="check" className="h-10 w-10 rounded-lg object-cover" />
                            </a>
                          ) : null}
                          <label className="cursor-pointer rounded-lg border border-border bg-bg px-3 py-1.5 text-xs font-semibold text-white">
                            {uploading === f.key ? "Uploading…" : values[f.key] ? "Change" : "Add photo"}
                            <input
                              type="file"
                              accept="image/*"
                              capture="environment"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) uploadPhoto(f.key, file);
                              }}
                            />
                          </label>
                        </div>
                      ) : (
                        <input
                          type={f.input === "date" ? "date" : f.input === "time" ? "time" : "text"}
                          className="w-36 rounded-lg border border-border bg-bg px-2 py-1.5 text-sm text-white"
                          value={String(values[f.key] ?? "")}
                          onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                        />
                      )}
                    </label>
                  )
                )}
              </div>

              <textarea className="field mt-3 min-h-16 resize-y" placeholder="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
              {notice && <p className="mt-3 text-sm text-brand">{notice}</p>}
              <button className="primary-button mt-3 w-full" onClick={submit} disabled={saving}>
                {saving ? "Saving…" : "Save"}
              </button>
            </>
          )}
        </div>
      )}

      {mode === "status" && (
        <div className="panel p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">Daily checks</p>
              <h3 className="mt-1 text-lg font-semibold text-white">Who&apos;s done theirs</h3>
            </div>
            <span className="text-sm text-text-secondary">{statusSubmitted}/{statusBoard.length} in</span>
          </div>
          <div className="mt-4 divide-y divide-border overflow-hidden rounded-xl border border-border">
            {statusBoard.length === 0 && <p className="px-4 py-4 text-sm text-text-secondary">No one to show yet.</p>}
            {statusBoard.map((p) => (
              <div key={p.profile_id} className="flex items-center justify-between px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-white">{p.name || "—"}</p>
                  <p className="text-xs text-text-secondary">{ROLE_LABELS[p.role]}</p>
                </div>
                <span className={`flex items-center gap-1.5 text-xs font-semibold ${p.submitted ? "text-green-400" : "text-muted"}`}>
                  <span className={`h-2 w-2 rounded-full ${p.submitted ? "bg-green-400" : "bg-border"}`} />
                  {p.submitted ? "Done" : "Pending"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {mode === "values" && (
        <div className="panel p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">{role === "foreman" ? "Crew today" : "Team today"}</p>
              <h3 className="mt-1 text-lg font-semibold text-white">Daily results</h3>
            </div>
            <span className="text-sm text-text-secondary">{submittedCount}/{rosterRows.length} in</span>
          </div>
          <div className="mt-4 divide-y divide-border overflow-hidden rounded-xl border border-border">
            {rosterRows.length === 0 && <p className="px-4 py-4 text-sm text-text-secondary">No one to show yet.</p>}
            {rosterRows.map((p) => {
              const check = checksByProfile.get(p.id);
              const pFields = fieldsFor(data?.items, p.role, cadence);
              const done = check ? pFields.every((f) => answered(f, check.values[f.key])) : false;
              const label = !check ? { t: "Pending", c: "text-muted", d: "bg-border" } : done ? { t: "Done", c: "text-green-400", d: "bg-green-400" } : { t: "Partial", c: "text-yellow-400", d: "bg-yellow-400" };
              return (
                <div key={p.id} className="px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-white">{p.name || p.email}</p>
                      <p className="text-xs text-text-secondary">{ROLE_LABELS[p.role]}</p>
                    </div>
                    <span className={`flex items-center gap-1.5 text-xs font-semibold ${label.c}`}>
                      <span className={`h-2 w-2 rounded-full ${label.d}`} />
                      {label.t}
                    </span>
                  </div>
                  {check && (
                    <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-text-secondary">
                      {pFields.map((f) => {
                        const v = check.values[f.key];
                        return (
                          <span key={f.key}>
                            {f.label.split(" / ")[0]}:{" "}
                            <span className="text-white">
                              {f.input === "yes_no" ? (v ? "✓" : "✗") : f.input === "number" || f.input === "currency" ? `${Number(v ?? 0)}${f.unit ?? ""}` : String(v ?? "—")}
                            </span>
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
