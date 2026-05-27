"use client";

import { FormEvent, useMemo, useState } from "react";
import TopNav from "@/components/TopNav";
import BottomNav from "@/components/BottomNav";
import { createClient } from "@/lib/supabase/client";
import type { AuditEvent, ChecklistItem, KpiEntry, KpiTarget, Profile, UserRole } from "@/lib/types";

type Tab = "overview" | "entry" | "staff" | "checklist" | "targets" | "audit";
const tabs: { id: Tab; label: string }[] = [
  { id: "overview", label: "Month overview" }, { id: "entry", label: "KPI entry" }, { id: "staff", label: "Staff" },
  { id: "checklist", label: "Checklist" }, { id: "targets", label: "Targets" }, { id: "audit", label: "Audit log" },
];
const roleOptions: (UserRole | "")[] = ["", "super_admin", "coo", "foreman", "sparky"];

function money(value: number) {
  return value.toLocaleString("en-NZ", { style: "currency", currency: "NZD", maximumFractionDigits: 0 });
}

export default function CooDashboard({ viewer, initialStaff, initialEntries, initialChecklist, initialTargets, initialAudit, month, year }: {
  viewer: Profile; initialStaff: Profile[]; initialEntries: KpiEntry[]; initialChecklist: ChecklistItem[]; initialTargets: KpiTarget[]; initialAudit: AuditEvent[]; month: number; year: number;
}) {
  const supabase = useMemo(() => createClient(), []);
  const [tab, setTab] = useState<Tab>("overview");
  const [staff, setStaff] = useState(initialStaff);
  const [entries, setEntries] = useState(initialEntries);
  const [checklist, setChecklist] = useState(initialChecklist);
  const [targets, setTargets] = useState(initialTargets);
  const [audit] = useState(initialAudit);
  const [notice, setNotice] = useState("");
  const sparkies = staff.filter((member) => member.role === "sparky" && member.active);
  const totalBonus = entries.reduce((total, entry) => total + Number(entry.bonus_earned), 0);
  const averageScore = entries.length ? entries.reduce((total, entry) => total + Number(entry.score), 0) / entries.length : 0;

  async function signOut() {
    await supabase.auth.signOut();
    window.location.assign("/login");
  }

  async function saveKpi(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/kpi", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
      sparky_id: form.get("sparky_id"), month, year, charge_out: Number(form.get("charge_out")), job_cards: Number(form.get("job_cards")),
      callbacks: Number(form.get("callbacks")), timesheets_days: Number(form.get("timesheets_days")),
    }) });
    const result = await response.json();
    if (!response.ok) return setNotice(result.error);
    setEntries((current) => [...current.filter((entry) => entry.sparky_id !== result.sparky_id), result]);
    setNotice("KPI entry recorded and audit logged.");
  }

  async function updateRole(profileId: string, role: string) {
    const response = await fetch("/api/users", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ profile_id: profileId, role: role || null }) });
    const result = await response.json();
    if (!response.ok) return setNotice(result.error);
    setStaff((current) => current.map((member) => member.id === result.id ? result : member));
    setNotice("Role assignment updated.");
  }

  async function archiveStaff(profileId: string) {
    const response = await fetch("/api/users", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ profile_id: profileId, active: false, archived: true }) });
    if (!response.ok) return setNotice("Could not archive staff member.");
    setStaff((current) => current.filter((member) => member.id !== profileId));
    setNotice("Staff member archived in recycle bin for 30 days.");
  }

  async function addChecklistItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/checklist-items", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
      label: form.get("label"), category: form.get("category"), colour: form.get("colour"), order_index: checklist.length * 10 + 10,
    }) });
    const result = await response.json();
    if (!response.ok) return setNotice(result.error);
    setChecklist((current) => [...current, result]);
    event.currentTarget.reset();
    setNotice("Checklist item added.");
  }

  async function disableChecklistItem(item: ChecklistItem) {
    const response = await fetch("/api/checklist-items", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: item.id, active: false }) });
    if (!response.ok) return setNotice("Could not update checklist.");
    setChecklist((current) => current.map((entry) => entry.id === item.id ? { ...entry, active: false } : entry));
    setNotice("Checklist item retired; historical submissions remain intact.");
  }

  async function saveTarget(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/targets", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
      target_type: form.get("target_type"), value: Number(form.get("value")), sparky_id: form.get("sparky_id") || null, effective_from: form.get("effective_from"),
    }) });
    const result = await response.json();
    if (!response.ok) return setNotice(result.error);
    setTargets((current) => [result, ...current]);
    setNotice("New target version is effective from the selected date.");
  }

  async function closeMonth() {
    const response = await fetch("/api/month-end", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ month, year }) });
    const result = await response.json();
    setNotice(response.ok ? `Month end stored. Total bonus ${money(result.summary.total_bonus)}.` : result.error);
  }

  return (
    <div className="industrial-grid min-h-screen pb-24 md:pb-10">
      <TopNav role={viewer.role!} userName={viewer.name || viewer.email || viewer.phone || "COO"} onSignOut={signOut} />
      <header className="border-b border-border px-5 pb-6 pt-7 md:px-8 md:pt-10">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand">Operations control</p>
          <div className="mt-3 flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <h1 className="font-display text-5xl uppercase text-white">COO Dashboard</h1>
              <p className="mt-2 text-sm text-text-secondary">Month {month}, {year} | manual KPI capture and bonus reconciliation</p>
            </div>
            <div className="flex gap-3">
              <a className="secondary-button !w-auto" href={`/api/reports/bonus?month=${month}&year=${year}&format=csv`}>Export CSV</a>
              <a className="secondary-button !w-auto" href={`/api/reports/bonus?month=${month}&year=${year}&format=pdf`}>Export PDF</a>
              <button className="primary-button !w-auto" onClick={closeMonth}>Close month</button>
            </div>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-5 py-6 md:px-8">
        {notice && <div className="mb-6 rounded-xl border border-brand/20 bg-brand/10 px-4 py-3 text-sm text-brand">{notice}</div>}
        <div className="mb-7 flex gap-2 overflow-x-auto pb-2">
          {tabs.map((item) => <button key={item.id} onClick={() => setTab(item.id)} className={`whitespace-nowrap rounded-xl px-4 py-3 text-sm font-semibold ${tab === item.id ? "bg-brand text-bg" : "bg-surface text-text-secondary"}`}>{item.label}</button>)}
        </div>
        {tab === "overview" && <section className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            {[["Active sparkies", sparkies.length], ["Average score", `${averageScore.toFixed(1)}/100`], ["Bonus due", money(totalBonus)]].map(([label, value]) => <div key={String(label)} className="panel p-5"><p className="text-xs uppercase tracking-widest text-text-secondary">{label}</p><p className="mt-3 text-3xl font-semibold text-white">{value}</p></div>)}
          </div>
          <div className="panel overflow-hidden"><div className="border-b border-border px-5 py-4 text-sm font-semibold text-white">Monthly crew summary</div>{sparkies.map((sparky) => { const entry = entries.find((row) => row.sparky_id === sparky.id); return <div key={sparky.id} className="grid grid-cols-[1fr_auto_auto] gap-4 border-b border-border px-5 py-4 text-sm last:border-0"><span>{sparky.name || sparky.email || sparky.phone}</span><span className="text-brand">{entry ? `${entry.score}/100` : "Pending"}</span><span className="w-24 text-right text-green-300">{entry ? money(Number(entry.bonus_earned)) : "-"}</span></div>; })}</div>
        </section>}
        {tab === "entry" && <form onSubmit={saveKpi} className="panel grid gap-4 p-5 md:max-w-3xl md:grid-cols-2">
          <select className="field md:col-span-2" name="sparky_id" required><option value="">Select sparky</option>{sparkies.map((sparky) => <option key={sparky.id} value={sparky.id}>{sparky.name || sparky.email || sparky.phone}</option>)}</select>
          {[["charge_out", "Charge out %"], ["job_cards", "Job cards"], ["callbacks", "Callbacks"], ["timesheets_days", "Timesheets days"]].map(([name, label]) => <label key={name} className="text-xs uppercase tracking-widest text-text-secondary">{label}<input className="field mt-2" name={name} type="number" step="0.01" min="0" required /></label>)}
          <button className="primary-button md:col-span-2" type="submit">Save monthly KPI</button>
        </form>}
        {tab === "staff" && <div className="panel overflow-hidden">{staff.map((member) => <div key={member.id} className="flex flex-col gap-3 border-b border-border p-4 last:border-0 md:flex-row md:items-center"><div className="flex-1"><p className="font-medium">{member.name || "Pending profile"}</p><p className="text-xs text-text-secondary">{member.email || member.phone || "No email recorded"}</p></div><select value={member.role || ""} onChange={(event) => updateRole(member.id, event.target.value)} className="field !w-auto min-w-40" disabled={member.role === "super_admin" && viewer.role !== "super_admin"}>{roleOptions.map((role) => <option key={role || "none"} value={role}>{role || "No role"}</option>)}</select>{member.id !== viewer.id && <button onClick={() => archiveStaff(member.id)} className="secondary-button !w-auto text-red-300">Archive</button>}</div>)}</div>}
        {tab === "checklist" && <section className="grid gap-5 lg:grid-cols-[1fr_360px]"><div className="panel overflow-hidden">{checklist.map((item) => <div key={item.id} className="flex items-center gap-4 border-b border-border p-4 last:border-0"><span className="h-3 w-3 rounded-full" style={{ background: item.colour }} /><div className="flex-1"><p className={item.active ? "" : "text-text-secondary line-through"}>{item.label}</p><p className="text-xs text-text-secondary">{item.category}</p></div>{item.active && <button className="secondary-button !w-auto" onClick={() => disableChecklistItem(item)}>Retire</button>}</div>)}</div><form className="panel space-y-4 p-5" onSubmit={addChecklistItem}><h2 className="text-lg font-semibold">Add checklist item</h2><input className="field" name="label" placeholder="Checklist task" required /><input className="field" name="category" placeholder="Category" required /><input className="field h-12" name="colour" type="color" defaultValue="#00AEEF" /><button className="primary-button" type="submit">Add item</button></form></section>}
        {tab === "targets" && <section className="grid gap-5 lg:grid-cols-[1fr_360px]"><div className="panel overflow-hidden">{targets.slice(0, 12).map((target) => <div key={target.id} className="grid grid-cols-[1fr_auto] border-b border-border p-4 text-sm last:border-0"><span className="capitalize">{target.target_type.replace("_", " ")} {target.sparky_id ? "(individual)" : "(global)"}</span><span className="text-brand">{target.value} from {target.effective_from}</span></div>)}</div><form className="panel space-y-4 p-5" onSubmit={saveTarget}><h2 className="text-lg font-semibold">New target version</h2><select className="field" name="target_type" required>{["charge_out", "job_cards", "callbacks", "timesheets_days"].map((type) => <option key={type}>{type}</option>)}</select><select className="field" name="sparky_id"><option value="">Global target</option>{sparkies.map((sparky) => <option key={sparky.id} value={sparky.id}>{sparky.name}</option>)}</select><input className="field" name="value" type="number" step="0.01" min="0" required /><input className="field" name="effective_from" type="date" required /><button className="primary-button">Save version</button></form></section>}
        {tab === "audit" && <div className="panel overflow-hidden">{audit.length ? audit.map((event) => <div key={event.id} className="flex items-center justify-between gap-4 border-b border-border p-4 text-sm last:border-0"><div><span className="text-brand">{event.action.toUpperCase()}</span> <span className="text-white">{event.table_name}</span></div><time className="text-xs text-text-secondary">{new Date(event.created_at).toLocaleString("en-NZ")}</time></div>) : <p className="p-6 text-text-secondary">Audit entries appear after manager changes.</p>}</div>}
      </main>
      <BottomNav role={viewer.role!} />
    </div>
  );
}
