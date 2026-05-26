"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Profile, KpiEntry } from "@/lib/types";
import BottomNav from "@/components/BottomNav";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const ROLE_STYLE: Record<string, string> = {
  admin: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  foreman: "bg-brand/20 text-brand border-brand/30",
  sparky: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
};

const ROLE_LABEL: Record<string, string> = {
  admin: "Admin",
  foreman: "Foreman",
  sparky: "Sparky",
};

function calcScore(co: number, jc: number, cb: number, ts: number) {
  const s1 = Math.min((co / 85) * 100, 100);
  const s2 = Math.min((jc / 20) * 100, 100);
  const s3 = Math.max(0, (1 - cb / 5) * 100);
  const s4 = Math.min((ts / 10) * 100, 100);
  return Math.round(((s1 + s2 + s3 + s4) / 4) * 10) / 10;
}

function initials(p: Profile) {
  const src = p.name?.trim() || p.phone || "?";
  return src
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

type Toast = { msg: string; type: "success" | "error" } | null;
type RoleVal = "admin" | "foreman" | "sparky" | null;

interface KpiFormState {
  charge_out: string;
  job_cards: string;
  callbacks: string;
  timesheets_days: string;
}

interface Props {
  adminName: string;
  initialProfiles: Profile[];
  initialKpiEntries: KpiEntry[];
  currentMonth: number;
  currentYear: number;
}

export default function AdminDashboard({
  adminName,
  initialProfiles,
  initialKpiEntries,
  currentMonth,
  currentYear,
}: Props) {
  const supabase = createClient();

  const [profiles, setProfiles] = useState<Profile[]>(initialProfiles);
  const [kpiEntries, setKpiEntries] = useState<KpiEntry[]>(initialKpiEntries);
  const [activeTab, setActiveTab] = useState<"team" | "kpis">("team");
  const [toast, setToast] = useState<Toast>(null);
  const [saving, setSaving] = useState(false);

  // Role sheet
  const [roleSheet, setRoleSheet] = useState<Profile | null>(null);

  // KPI entry sheet
  const [kpiSheet, setKpiSheet] = useState<Profile | null>(null);
  const [kpiMonth, setKpiMonth] = useState(currentMonth);
  const [kpiYear, setKpiYear] = useState(currentYear);
  const [kpiForm, setKpiForm] = useState<KpiFormState>({
    charge_out: "",
    job_cards: "",
    callbacks: "",
    timesheets_days: "",
  });

  function showToast(msg: string, type: "success" | "error" = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  // Derived
  const sparkies = profiles.filter((p) => p.role === "sparky");
  const foremanCount = profiles.filter((p) => p.role === "foreman").length;

  // Role save
  async function saveRole(profileId: string, role: RoleVal) {
    setSaving(true);
    try {
      const res = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile_id: profileId, role }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setProfiles((prev) =>
        prev.map((p) => (p.id === profileId ? { ...p, role: role as RoleVal } : p))
      );
      showToast("Role updated ✓");
    } catch (e: unknown) {
      showToast((e as Error).message || "Failed to update role", "error");
    } finally {
      setSaving(false);
      setRoleSheet(null);
    }
  }

  // Open KPI sheet — prefill if exists
  function openKpiSheet(sparky: Profile) {
    const existing = kpiEntries.find(
      (e) => e.sparky_id === sparky.id && e.month === kpiMonth && e.year === kpiYear
    );
    setKpiForm(
      existing
        ? {
            charge_out: String(existing.charge_out),
            job_cards: String(existing.job_cards),
            callbacks: String(existing.callbacks),
            timesheets_days: String(existing.timesheets_days),
          }
        : { charge_out: "", job_cards: "", callbacks: "", timesheets_days: "" }
    );
    setKpiSheet(sparky);
  }

  // KPI save
  async function saveKpi() {
    if (!kpiSheet) return;
    const co = parseFloat(kpiForm.charge_out);
    const jc = parseInt(kpiForm.job_cards);
    const cb = parseInt(kpiForm.callbacks);
    const ts = parseInt(kpiForm.timesheets_days);
    if ([co, jc, cb, ts].some((n) => isNaN(n))) {
      showToast("Fill in all fields", "error");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/kpi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sparky_id: kpiSheet.id,
          month: kpiMonth,
          year: kpiYear,
          charge_out: co,
          job_cards: jc,
          callbacks: cb,
          timesheets_days: ts,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      // Update local kpiEntries
      setKpiEntries((prev) => {
        const filtered = prev.filter(
          (e) =>
            !(e.sparky_id === kpiSheet.id && e.month === kpiMonth && e.year === kpiYear)
        );
        return [
          ...filtered,
          {
            id: data.id ?? "tmp-" + Date.now(),
            sparky_id: kpiSheet.id,
            month: kpiMonth,
            year: kpiYear,
            charge_out: co,
            job_cards: jc,
            callbacks: cb,
            timesheets_days: ts,
            score: data.score,
            bonus_earned: data.bonus_earned,
            created_at: new Date().toISOString(),
          },
        ];
      });
      showToast(`Saved — Score: ${data.score}/100 · Bonus: $${data.bonus_earned}`);
    } catch (e: unknown) {
      showToast((e as Error).message || "Failed to save KPI", "error");
    } finally {
      setSaving(false);
      setKpiSheet(null);
    }
  }

  // Live score preview
  const previewScore =
    kpiForm.charge_out && kpiForm.job_cards && kpiForm.callbacks && kpiForm.timesheets_days
      ? calcScore(
          parseFloat(kpiForm.charge_out),
          parseInt(kpiForm.job_cards),
          parseInt(kpiForm.callbacks),
          parseInt(kpiForm.timesheets_days)
        )
      : null;

  // Month nav
  function prevMonth() {
    if (kpiMonth === 1) {
      setKpiMonth(12);
      setKpiYear((y) => y - 1);
    } else {
      setKpiMonth((m) => m - 1);
    }
  }
  function nextMonth() {
    const now = new Date();
    const atCurrent =
      kpiYear > now.getFullYear() ||
      (kpiYear === now.getFullYear() && kpiMonth >= now.getMonth() + 1);
    if (atCurrent) return;
    if (kpiMonth === 12) {
      setKpiMonth(1);
      setKpiYear((y) => y + 1);
    } else {
      setKpiMonth((m) => m + 1);
    }
  }

  return (
    <div className="min-h-screen bg-bg pb-32">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-bg/80 backdrop-blur-xl border-b border-border px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-text-secondary">Admin</p>
            <h1 className="text-lg font-bold text-text-primary">{adminName}</h1>
          </div>
          <button
            onClick={signOut}
            className="text-xs text-text-secondary px-3 py-2 rounded-xl bg-surface border border-border active:opacity-70"
          >
            Sign out
          </button>
        </div>
      </div>

      {/* Section switcher */}
      <div className="flex gap-2 px-4 pt-4 pb-2">
        {(["team", "kpis"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
              activeTab === tab
                ? "bg-brand text-white"
                : "bg-surface border border-border text-text-secondary"
            }`}
          >
            {tab === "team" ? "👥  Team" : "📊  KPIs"}
          </button>
        ))}
      </div>

      <div className="px-4 pt-2 space-y-4">
        {/* ── TEAM TAB ── */}
        {activeTab === "team" && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Total crew", value: profiles.length },
                { label: "Foremen", value: foremanCount },
                { label: "Sparkies", value: sparkies.length },
              ].map((s) => (
                <div
                  key={s.label}
                  className="bg-surface border border-border rounded-2xl p-4 text-center"
                >
                  <div className="text-2xl font-bold text-brand">{s.value}</div>
                  <div className="text-xs text-text-secondary mt-1">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Team list */}
            <div>
              <p className="text-xs font-semibold text-text-secondary uppercase tracking-widest mb-3">
                Team members
              </p>
              <div className="bg-surface border border-border rounded-2xl overflow-hidden divide-y divide-border">
                {profiles.length === 0 ? (
                  <p className="text-sm text-text-secondary text-center py-8">No users yet</p>
                ) : (
                  profiles.map((u) => (
                    <div key={u.id} className="flex items-center gap-3 px-4 py-4">
                      <div className="w-10 h-10 rounded-full bg-brand/20 flex items-center justify-center text-brand font-bold text-sm shrink-0">
                        {initials(u)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text-primary truncate">
                          {u.name || "(no name)"}
                        </p>
                        <p className="text-xs text-text-secondary">{u.phone}</p>
                      </div>
                      <button
                        onClick={() => setRoleSheet(u)}
                        className={`text-xs px-2.5 py-1 rounded-full font-medium border active:opacity-70 transition-colors ${
                          u.role
                            ? ROLE_STYLE[u.role] ?? "bg-border/50 text-text-muted border-border"
                            : "bg-border/50 text-text-muted border-border"
                        }`}
                      >
                        {u.role ? (ROLE_LABEL[u.role] ?? u.role) : "Assign"}
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}

        {/* ── KPI TAB ── */}
        {activeTab === "kpis" && (
          <>
            {/* Month nav */}
            <div className="flex items-center justify-between bg-surface border border-border rounded-2xl px-5 py-3">
              <button
                onClick={prevMonth}
                className="text-brand font-bold text-xl px-2 active:opacity-70"
              >
                ‹
              </button>
              <span className="text-sm font-semibold text-text-primary">
                {MONTHS[kpiMonth - 1]} {kpiYear}
              </span>
              <button
                onClick={nextMonth}
                className="text-brand font-bold text-xl px-2 active:opacity-70"
              >
                ›
              </button>
            </div>

            {/* Sparky list */}
            <div>
              <p className="text-xs font-semibold text-text-secondary uppercase tracking-widest mb-3">
                Sparkies
              </p>
              {sparkies.length === 0 ? (
                <div className="bg-surface border border-border rounded-2xl p-6 text-center">
                  <p className="text-sm text-text-secondary">No sparkies assigned yet</p>
                  <p className="text-xs text-text-muted mt-1">Assign roles in the Team tab</p>
                </div>
              ) : (
                <div className="bg-surface border border-border rounded-2xl overflow-hidden divide-y divide-border">
                  {sparkies.map((sparky) => {
                    const entry = kpiEntries.find(
                      (e) =>
                        e.sparky_id === sparky.id &&
                        e.month === kpiMonth &&
                        e.year === kpiYear
                    );
                    return (
                      <button
                        key={sparky.id}
                        onClick={() => openKpiSheet(sparky)}
                        className="w-full flex items-center gap-3 px-4 py-4 active:bg-border/20 text-left"
                      >
                        <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-300 font-bold text-sm shrink-0">
                          {initials(sparky)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-text-primary truncate">
                            {sparky.name || "(no name)"}
                          </p>
                          {entry ? (
                            <div className="flex items-center gap-2 mt-1">
                              <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-brand rounded-full"
                                  style={{ width: `${entry.score}%` }}
                                />
                              </div>
                              <span className="text-xs text-brand font-semibold shrink-0">
                                {entry.score}
                              </span>
                            </div>
                          ) : (
                            <p className="text-xs text-text-muted mt-0.5">No data — tap to enter</p>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          {entry ? (
                            <>
                              <p className="text-xs text-green-400 font-semibold">
                                ${Number(entry.bonus_earned).toFixed(0)}
                              </p>
                              <p className="text-xs text-text-muted">bonus</p>
                            </>
                          ) : (
                            <span className="text-xs text-brand font-medium">Enter →</span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* ── ROLE SHEET ── */}
      {roleSheet && (
        <div className="fixed inset-0 z-50" onClick={() => setRoleSheet(null)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="absolute bottom-0 left-0 right-0 bg-surface border-t border-border rounded-t-3xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-border rounded-full mx-auto mb-5" />
            <p className="text-base font-semibold text-text-primary mb-0.5">
              {roleSheet.name || roleSheet.phone}
            </p>
            <p className="text-xs text-text-secondary mb-5">Select a role</p>
            <div className="space-y-2">
              {(
                [
                  { value: "admin" as RoleVal, label: "Admin", colour: "text-purple-300" },
                  { value: "foreman" as RoleVal, label: "Foreman", colour: "text-brand" },
                  { value: "sparky" as RoleVal, label: "Sparky", colour: "text-yellow-300" },
                  { value: null, label: "No role", colour: "text-text-muted" },
                ] as const
              ).map((opt) => (
                <button
                  key={String(opt.value)}
                  onClick={() => saveRole(roleSheet.id, opt.value)}
                  disabled={saving}
                  className={`w-full flex items-center justify-between px-5 py-3.5 rounded-2xl border transition-colors active:opacity-70 disabled:opacity-50 ${
                    roleSheet.role === opt.value
                      ? "border-brand bg-brand/10"
                      : "border-border bg-bg"
                  }`}
                >
                  <span className={`text-sm font-medium ${opt.colour}`}>{opt.label}</span>
                  {roleSheet.role === opt.value && (
                    <span className="text-brand text-sm">✓</span>
                  )}
                </button>
              ))}
            </div>
            <button
              onClick={() => setRoleSheet(null)}
              className="w-full mt-4 py-3 rounded-2xl border border-border text-sm text-text-secondary active:opacity-70"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── KPI ENTRY SHEET ── */}
      {kpiSheet && (
        <div className="fixed inset-0 z-50" onClick={() => setKpiSheet(null)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="absolute bottom-0 left-0 right-0 bg-surface border-t border-border rounded-t-3xl p-6 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-border rounded-full mx-auto mb-5" />
            <p className="text-base font-semibold text-text-primary mb-0.5">
              {kpiSheet.name || kpiSheet.phone}
            </p>
            <p className="text-xs text-text-secondary mb-5">
              KPI entry — {MONTHS[kpiMonth - 1]} {kpiYear}
            </p>

            <div className="space-y-4 mb-4">
              {(
                [
                  {
                    key: "charge_out",
                    label: "Charge Out %",
                    placeholder: "e.g. 82",
                    target: "Target: 85%",
                  },
                  {
                    key: "job_cards",
                    label: "Job Cards completed",
                    placeholder: "e.g. 18",
                    target: "Target: 20",
                  },
                  {
                    key: "callbacks",
                    label: "Callbacks (rework)",
                    placeholder: "e.g. 1",
                    target: "Target: < 2",
                  },
                  {
                    key: "timesheets_days",
                    label: "Timesheets on time (days)",
                    placeholder: "e.g. 9",
                    target: "Target: 10",
                  },
                ] as const
              ).map((field) => (
                <div key={field.key}>
                  <div className="flex justify-between mb-1.5">
                    <label className="text-xs font-medium text-text-primary">
                      {field.label}
                    </label>
                    <span className="text-xs text-text-muted">{field.target}</span>
                  </div>
                  <input
                    type="number"
                    inputMode="numeric"
                    placeholder={field.placeholder}
                    value={kpiForm[field.key]}
                    onChange={(e) =>
                      setKpiForm((f) => ({ ...f, [field.key]: e.target.value }))
                    }
                    className="w-full bg-bg border border-border rounded-xl px-4 py-3 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-brand transition-colors"
                  />
                </div>
              ))}
            </div>

            {/* Live score preview */}
            {previewScore !== null && (
              <div className="bg-brand/10 border border-brand/20 rounded-2xl px-4 py-3 mb-5">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-text-secondary">Calculated score</span>
                  <span className="text-xl font-bold text-brand">
                    {previewScore}
                    <span className="text-sm text-text-secondary font-normal">/100</span>
                  </span>
                </div>
                <div className="h-1.5 bg-border rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand rounded-full transition-all duration-300"
                    style={{ width: `${previewScore}%` }}
                  />
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setKpiSheet(null)}
                className="flex-1 py-3.5 rounded-2xl border border-border text-sm text-text-secondary active:opacity-70"
              >
                Cancel
              </button>
              <button
                onClick={saveKpi}
                disabled={saving}
                className="flex-1 py-3.5 rounded-2xl bg-brand text-white text-sm font-semibold active:opacity-70 disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save KPI"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-24 left-4 right-4 z-50 px-4 py-3 rounded-2xl text-sm font-medium text-center shadow-xl ${
            toast.type === "success"
              ? "bg-green-500/90 text-white"
              : "bg-red-500/90 text-white"
          }`}
        >
          {toast.msg}
        </div>
      )}

      <BottomNav />
    </div>
  );
}
