"use client";

import { useMemo, useState } from "react";
import TopNav from "@/components/TopNav";
import BottomNav from "@/components/BottomNav";
import { createClient } from "@/lib/supabase/client";
import type { ChecklistItem, KpiEntry, WeeklySubmission } from "@/lib/types";

const prompts = [
  ["went_well", "What went well this week?"],
  ["missed", "What was missed?"],
  ["decisions", "What decisions were made?"],
  ["escalate", "What needs escalation?"],
  ["support", "What support or training is required?"],
];

export default function ForemanDashboard({ foremanName, weekNum, year, existingSubmission, history, checklistItems, teamEntries, sparkies }: {
  foremanName: string; weekNum: number; year: number; existingSubmission: WeeklySubmission | null; history: WeeklySubmission[];
  checklistItems: ChecklistItem[]; teamEntries: KpiEntry[]; sparkies: { id: string; name: string; phone: string }[];
}) {
  const supabase = useMemo(() => createClient(), []);
  const [checks, setChecks] = useState<Record<string, boolean>>(existingSubmission?.checklist ?? {});
  const [notes, setNotes] = useState<Record<string, string>>(existingSubmission?.notes ?? {});
  const [notesOpen, setNotesOpen] = useState(false);
  const [teamOpen, setTeamOpen] = useState(false);
  const [submitted, setSubmitted] = useState(!!existingSubmission);
  const [notice, setNotice] = useState("");
  const complete = checklistItems.filter((item) => checks[item.id]).length;
  const percentage = checklistItems.length ? Math.round((complete / checklistItems.length) * 100) : 0;
  const groups = checklistItems.reduce<Record<string, ChecklistItem[]>>((result, item) => {
    (result[item.category] ||= []).push(item);
    return result;
  }, {});

  async function signOut() {
    await supabase.auth.signOut();
    window.location.assign("/login");
  }

  async function submitWeek() {
    const response = await fetch("/api/weekly-submission", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ week_number: weekNum, year, checklist: checks, notes }) });
    const result = await response.json();
    if (!response.ok) return setNotice(result.error);
    setSubmitted(true);
    setNotice("Weekly check-in submitted.");
  }

  return (
    <div className="industrial-grid min-h-screen pb-28 md:pb-12">
      <TopNav role="foreman" userName={foremanName} onSignOut={signOut} />
      <main className="mx-auto max-w-6xl px-5 py-7 md:px-8 md:py-10">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand">Week {weekNum} | {year}</p>
            <h1 className="mt-3 font-display text-5xl uppercase text-white">Weekly Check</h1>
            <p className="mt-2 text-text-secondary">{foremanName} | foreman submission</p>
          </div>
          <div className="panel flex items-center gap-5 px-6 py-4">
            <div className="relative flex h-20 w-20 items-center justify-center rounded-full" style={{ background: `conic-gradient(#00AEEF ${percentage}%, #1E2230 ${percentage}% 100%)` }}>
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-bg text-lg font-semibold">{percentage}%</div>
            </div>
            <div><p className="text-sm text-text-secondary">Tasks complete</p><p className="text-2xl font-semibold">{complete} / {checklistItems.length}</p></div>
          </div>
        </div>
        {notice && <p className="mt-6 rounded-xl border border-brand/20 bg-brand/10 p-4 text-sm text-brand">{notice}</p>}
        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_350px]">
          <section className="space-y-4">
            {Object.entries(groups).map(([category, items]) => (
              <div className="panel overflow-hidden" key={category}>
                <div className="flex items-center gap-3 border-b border-border px-5 py-4">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: items[0].colour }} />
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-text-secondary">{category}</p>
                </div>
                {items.map((item) => (
                  <label className="flex cursor-pointer items-center gap-4 border-b border-border px-5 py-4 last:border-0" key={item.id}>
                    <input className="h-5 w-5 accent-brand" checked={!!checks[item.id]} onChange={(event) => setChecks((current) => ({ ...current, [item.id]: event.target.checked }))} type="checkbox" />
                    <span className={checks[item.id] ? "text-text-secondary line-through" : "text-white"}>{item.label}</span>
                  </label>
                ))}
              </div>
            ))}
            <button className="panel flex w-full items-center justify-between p-5 text-left" onClick={() => setNotesOpen((open) => !open)}>
              <span className="font-semibold">Reflection notes <span className="ml-2 text-xs text-text-secondary">5 prompts</span></span>
              <span className="text-brand">{notesOpen ? "Close" : "Open"}</span>
            </button>
            {notesOpen && <div className="panel space-y-4 p-5">{prompts.map(([key, label]) => <label className="block text-xs uppercase tracking-widest text-text-secondary" key={key}>{label}<textarea className="field mt-2 min-h-24 resize-y" value={notes[key] || ""} onChange={(event) => setNotes((current) => ({ ...current, [key]: event.target.value }))} /></label>)}</div>}
            <button className="primary-button" disabled={submitted} onClick={submitWeek}>{submitted ? "Week submitted" : "Submit weekly check"}</button>
          </section>
          <aside className="space-y-5">
            <button className="panel flex w-full items-center justify-between p-5 text-left" onClick={() => setTeamOpen((open) => !open)}>
              <div><p className="text-xs uppercase tracking-widest text-brand">Read only</p><p className="mt-2 font-semibold">Sparky KPIs</p></div><span className="text-brand">{teamOpen ? "Hide" : "View"}</span>
            </button>
            {teamOpen && <div className="panel overflow-hidden">{sparkies.map((sparky) => { const entry = teamEntries.find((row) => row.sparky_id === sparky.id); return <div key={sparky.id} className="border-b border-border p-4 last:border-0"><div className="flex justify-between"><span>{sparky.name || sparky.phone}</span><span className="text-brand">{entry ? `${entry.score}/100` : "Pending"}</span></div>{entry && <p className="mt-2 text-xs text-text-secondary">Charge out {entry.charge_out}% | Jobs {entry.job_cards} | Callbacks {entry.callbacks}</p>}</div>; })}</div>}
            <div className="panel p-5">
              <p className="text-xs uppercase tracking-widest text-text-secondary">Historical weeks</p>
              <div className="mt-4 space-y-3">{history.length ? history.map((submission) => <div className="flex items-center justify-between border-b border-border pb-3 text-sm last:border-0" key={submission.id}><span>Week {submission.week_number}, {submission.year}</span><span className="text-green-300">Submitted</span></div>) : <p className="text-sm text-text-secondary">No previous submissions.</p>}</div>
            </div>
          </aside>
        </div>
      </main>
      <BottomNav role="foreman" />
    </div>
  );
}
