"use client";

import { useState } from "react";

const CHECKLIST_ITEMS = [
  // Safety
  { id: "toolbox_talk", label: "Toolbox talk completed", category: "Safety" },
  { id: "ppe_checked", label: "PPE checked for all crew", category: "Safety" },
  { id: "hazards_identified", label: "Hazards identified & controlled", category: "Safety" },
  // Admin
  { id: "job_cards_signed", label: "Job cards signed off", category: "Admin" },
  { id: "timesheets_submitted", label: "Timesheets submitted", category: "Admin" },
  { id: "materials_ordered", label: "Materials ordered / confirmed", category: "Admin" },
  // Quality
  { id: "inspections_passed", label: "Inspections passed", category: "Quality" },
  { id: "rework_noted", label: "Rework items noted", category: "Quality" },
  // Team
  { id: "team_briefed", label: "Team briefed on tomorrow", category: "Team" },
  { id: "issues_escalated", label: "Issues escalated to office", category: "Team" },
];

const CATEGORIES = ["Safety", "Admin", "Quality", "Team"];

export default function ForemanDashboard() {
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const completed = Object.values(checklist).filter(Boolean).length;
  const total = CHECKLIST_ITEMS.length;
  const pct = Math.round((completed / total) * 100);
  const circumference = 2 * Math.PI * 40;
  const dash = (pct / 100) * circumference;

  function toggle(id: string) {
    setChecklist((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function handleSubmit() {
    setSubmitted(true);
    // TODO: POST to /api/weekly-submission
  }

  const today = new Date();
  const weekNum = Math.ceil(
    ((today.getTime() - new Date(today.getFullYear(), 0, 1).getTime()) / 86400000 +
      new Date(today.getFullYear(), 0, 1).getDay() + 1) / 7
  );

  return (
    <div className="min-h-screen bg-bg pb-24">
      {/* Header */}
      <div className="sticky top-0 bg-surface border-b border-border px-4 py-4 safe-top">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-text-primary">Weekly Check-in</h1>
            <p className="text-xs text-text-secondary">Week {weekNum} · {today.toLocaleDateString("en-NZ", { day: "numeric", month: "short" })}</p>
          </div>
          {/* Progress ring */}
          <div className="relative w-16 h-16">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" fill="none" stroke="#1E2230" strokeWidth="10" />
              <circle
                cx="50" cy="50" r="40" fill="none"
                stroke="#00AEEF" strokeWidth="10"
                strokeDasharray={`${dash} ${circumference}`}
                strokeLinecap="round"
                className="transition-all duration-500"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-bold text-brand">{pct}%</span>
            </div>
          </div>
        </div>
      </div>

      {submitted ? (
        <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-brand/20 flex items-center justify-center mb-4">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#00AEEF" strokeWidth="2.5">
              <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h2 className="text-xl font-bold mb-2">Submitted!</h2>
          <p className="text-text-secondary">Week {weekNum} check-in recorded.</p>
        </div>
      ) : (
        <div className="px-4 pt-4 space-y-6">
          {CATEGORIES.map((cat) => (
            <div key={cat}>
              <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-widest mb-3">
                {cat}
              </h2>
              <div className="bg-surface border border-border rounded-2xl overflow-hidden divide-y divide-border">
                {CHECKLIST_ITEMS.filter((i) => i.category === cat).map((item) => (
                  <button
                    key={item.id}
                    onClick={() => toggle(item.id)}
                    className="w-full flex items-center gap-3 px-4 py-4 active:bg-white/5 transition-colors text-left"
                  >
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                        checklist[item.id]
                          ? "bg-brand border-brand"
                          : "border-border"
                      }`}
                    >
                      {checklist[item.id] && (
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                      )}
                    </div>
                    <span className={`text-sm ${checklist[item.id] ? "line-through text-text-secondary" : "text-text-primary"}`}>
                      {item.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}

          {/* Notes */}
          <div>
            <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-widest mb-3">
              Notes
            </h2>
            <textarea
              value={notes.general || ""}
              onChange={(e) => setNotes({ ...notes, general: e.target.value })}
              placeholder="Any issues, blockers, or highlights for this week…"
              rows={4}
              className="w-full bg-surface border border-border rounded-2xl px-4 py-3 text-text-primary text-sm placeholder:text-muted resize-none focus:outline-none focus:border-brand transition-colors"
            />
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={completed < total}
            className="w-full bg-brand text-white font-semibold py-4 rounded-2xl disabled:opacity-40 active:scale-95 transition-all text-base"
          >
            {completed < total
              ? `Complete all items (${completed}/${total})`
              : "Submit week"}
          </button>
        </div>
      )}
    </div>
  );
}
