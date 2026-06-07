"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CADENCE_LABELS,
  ROLE_LABELS,
  checkFieldsFor,
  dailyFieldsFor,
  emptyValues,
  isComplete,
  type Cadence,
} from "@/lib/dailyChecks";
import type { DailyCheckWithProfile, DailyValue, UserRole } from "@/lib/types";

interface RosterPerson { id: string; name: string; email: string; role: UserRole }
export interface DailyStatusRow { profile_id: string; name: string; role: UserRole; submitted: boolean }
export interface DailyData {
  profileId: string;
  role: UserRole;
  date: string;
  checks: DailyCheckWithProfile[];
  roster: RosterPerson[];
  statusRows?: DailyStatusRow[]; // COO completion board (status only, no figures)
}

// super_admin + foreman see the full results board; COO sees a status-only
// completion board; sparky sees no rollup.
function rollupModeFor(role: UserRole): "values" | "status" | "none" {
  if (role === "super_admin" || role === "foreman") return "values";
  if (role === "coo") return "status";
  return "none";
}

function statusOf(check: DailyCheckWithProfile | undefined, role: UserRole) {
  if (!check) return { label: "Pending", cls: "text-muted", dot: "bg-border" };
  if (isComplete(check, role)) return { label: "Done", cls: "text-green-400", dot: "bg-green-400" };
  return { label: "Partial", cls: "text-yellow-400", dot: "bg-yellow-400" };
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
  const fields = useMemo(() => checkFieldsFor(role, cadence), [role, cadence]);
  const [data, setData] = useState<DailyData | null>(preview ?? null);
  const [statusRows, setStatusRows] = useState<DailyStatusRow[]>(preview?.statusRows ?? []);
  const [loading, setLoading] = useState(!preview);
  const [values, setValues] = useState<Record<string, DailyValue>>(emptyValues(role, cadence));
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");

  // Load today's data (skipped in preview).
  useEffect(() => {
    if (preview) return;
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
        const own = d.checks.find((c) => c.profile_id === d.profileId);
        if (own) {
          setValues({ ...emptyValues(role, cadence), ...own.values });
          setNote(own.note ?? "");
        }
        if (statusRes && statusRes.ok) {
          const s = (await statusRes.json()) as { status: DailyStatusRow[] };
          if (active) setStatusRows(s.status ?? []);
        }
      } catch {
        if (active) setNotice("Couldn't load today's check.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [preview, role, cadence]);

  // Seed form from preview's own row.
  useEffect(() => {
    if (!preview) return;
    const own = preview.checks.find((c) => c.profile_id === preview.profileId);
    if (own) {
      setValues({ ...emptyValues(role, cadence), ...own.values });
      setNote(own.note ?? "");
    }
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
      // Reflect the saved row in the local rollup.
      setData((prev) => {
        if (!prev) return prev;
        const others = prev.checks.filter((c) => c.profile_id !== prev.profileId);
        const ownProfile = prev.roster.find((p) => p.id === prev.profileId) ?? null;
        return {
          ...prev,
          checks: [
            ...others,
            { ...saved, profile: ownProfile ? { name: ownProfile.name, email: ownProfile.email, role: ownProfile.role } : null },
          ],
        };
      });
      setNotice("Today's check saved.");
    } catch (e) {
      setNotice(e instanceof Error && e.message !== "save" ? e.message : "Could not save.");
    } finally {
      setSaving(false);
    }
  }

  const dateLabel = data?.date ?? "today";
  const mode = cadence === "daily" ? rollupModeFor(role) : "none";
  const periodLabel = cadence === "daily" ? "Today" : cadence === "weekly" ? "This week" : "This month";
  const checksByProfile = new Map((data?.checks ?? []).map((c) => [c.profile_id, c]));

  // Values rollup roster: super_admin → everyone, foreman → sparkies; excl self.
  const rosterRows = (data?.roster ?? [])
    .filter((p) => p.id !== data?.profileId)
    .filter((p) => (role === "foreman" ? p.role === "sparky" : true));
  const submittedCount = rosterRows.filter((p) => checksByProfile.has(p.id)).length;

  // COO status board: who has / hasn't submitted today (no figures). Excl self.
  const statusBoard = statusRows.filter((p) => p.profile_id !== data?.profileId);
  const statusSubmitted = statusBoard.filter((p) => p.submitted).length;

  return (
    <section className="mb-6 grid gap-5 lg:grid-cols-2">
      {/* ── Own daily check (skipped for roles with no KPIs, e.g. super_admin) ── */}
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
                f.type === "boolean" ? (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => setValues((v) => ({ ...v, [f.key]: !v[f.key] }))}
                    className="flex w-full items-center justify-between rounded-xl border border-border bg-surface px-4 py-3 text-left"
                  >
                    <span className="text-sm text-white">{f.label}</span>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        values[f.key] ? "bg-brand text-background" : "bg-black/30 text-text-secondary"
                      }`}
                    >
                      {values[f.key] ? "Yes" : "No"}
                    </span>
                  </button>
                ) : (
                  <label
                    key={f.key}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface px-4 py-2.5"
                  >
                    <span className="text-sm text-white">
                      {f.label}
                      {f.target !== undefined && (
                        <span className="ml-2 text-xs text-muted">target {f.target}{f.unit ?? ""}</span>
                      )}
                    </span>
                    <input
                      type="number"
                      min={0}
                      inputMode="numeric"
                      className="w-20 rounded-lg border border-border bg-bg px-2 py-1.5 text-right text-sm text-white"
                      value={Number(values[f.key] ?? 0)}
                      onChange={(e) => setValues((v) => ({ ...v, [f.key]: Math.max(0, Number(e.target.value) || 0) }))}
                    />
                  </label>
                )
              )}
            </div>

            <textarea
              className="field mt-3 min-h-16 resize-y"
              placeholder="Note (optional)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />

            {notice && <p className="mt-3 text-sm text-brand">{notice}</p>}

            <button className="primary-button mt-3 w-full" onClick={submit} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </button>
          </>
        )}
      </div>

      )}

      {/* ── COO status-only board (who has done theirs — no figures) ── */}
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
            {statusBoard.length === 0 && (
              <p className="px-4 py-4 text-sm text-text-secondary">No one to show yet.</p>
            )}
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

      {/* ── Full results board (super_admin: everyone, foreman: crew) ── */}
      {mode === "values" && (
        <div className="panel p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">
                {role === "foreman" ? "Crew today" : "Team today"}
              </p>
              <h3 className="mt-1 text-lg font-semibold text-white">Daily results</h3>
            </div>
            <span className="text-sm text-text-secondary">
              {submittedCount}/{rosterRows.length} in
            </span>
          </div>

          <div className="mt-4 divide-y divide-border overflow-hidden rounded-xl border border-border">
            {rosterRows.length === 0 && (
              <p className="px-4 py-4 text-sm text-text-secondary">No one to show yet.</p>
            )}
            {rosterRows.map((p) => {
              const check = checksByProfile.get(p.id);
              const s = statusOf(check, p.role);
              return (
                <div key={p.id} className="px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-white">{p.name || p.email}</p>
                      <p className="text-xs text-text-secondary">{ROLE_LABELS[p.role]}</p>
                    </div>
                    <span className={`flex items-center gap-1.5 text-xs font-semibold ${s.cls}`}>
                      <span className={`h-2 w-2 rounded-full ${s.dot}`} />
                      {s.label}
                    </span>
                  </div>
                  {check && (
                    <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-text-secondary">
                      {dailyFieldsFor(p.role).map((f) => {
                        const v = check.values[f.key];
                        return (
                          <span key={f.key}>
                            {f.label.split(" / ")[0]}:{" "}
                            <span className="text-white">
                              {f.type === "boolean" ? (v ? "✓" : "✗") : `${Number(v ?? 0)}${f.unit ?? ""}`}
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
