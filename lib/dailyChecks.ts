import type { DailyCheck, DailyValue, UserRole } from "@/lib/types";

// ---------------------------------------------------------------------------
// Check definitions per role + cadence (daily / weekly / monthly). A mix of
// numeric KPIs (number, optional target) and yes/no KPAs (boolean). Submitted
// answers are stored as jsonb in public.daily_checks.values, keyed by `key`,
// one row per (profile, cadence, period). Editable source of truth for now —
// an admin-editable version is the next phase.
// ---------------------------------------------------------------------------

export type DailyFieldType = "number" | "boolean";
export type Cadence = "daily" | "weekly" | "monthly";
export const CADENCES: Cadence[] = ["daily", "weekly", "monthly"];
export const CADENCE_LABELS: Record<Cadence, string> = { daily: "Daily", weekly: "Weekly", monthly: "Monthly" };

export interface DailyField {
  key: string;
  label: string;
  type: DailyFieldType;
  unit?: string; // number only, e.g. "%", "$", "h"
  target?: number; // number only — shown as the goal
  goodWhenFalse?: boolean; // boolean where "no" is the good answer (rare)
}

export const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: "Super admin",
  coo: "COO",
  office_admin: "Office admin",
  foreman: "Operations Manager",
  sparky: "Sparky",
};

export const DAILY_CHECKS: Record<UserRole, DailyField[]> = {
  sparky: [
    { key: "timesheet_submitted", label: "Timesheet submitted", type: "boolean" },
    { key: "job_card_completed", label: "Job card completed with notes", type: "boolean" },
    { key: "photos_taken", label: "Photos taken", type: "boolean" },
    { key: "premob_checklist", label: "Pre-mob checklist done", type: "boolean" },
  ],
  foreman: [
    { key: "jobs_confirmed", label: "Jobs scheduled for tomorrow confirmed", type: "boolean" },
    { key: "site_issues_flagged", label: "Site issues flagged", type: "boolean" },
  ],
  office_admin: [
    { key: "invoices_sent", label: "Invoices sent", type: "number", target: 5 },
    { key: "overdue_followups", label: "Overdue invoice follow-ups", type: "number" },
    { key: "job_cards_filed", label: "Job cards received and filed", type: "boolean" },
    { key: "quote_followups", label: "Quote follow-ups done", type: "boolean" },
  ],
  coo: [],
  super_admin: [],
};

export const WEEKLY_CHECKS: Record<UserRole, DailyField[]> = {
  sparky: [
    { key: "callbacks", label: "Callbacks on their jobs", type: "number", target: 0 },
  ],
  foreman: [
    { key: "labour_utilisation", label: "Labour utilisation", type: "number", unit: "%", target: 85 },
    { key: "jobs_on_time", label: "Jobs completed on time", type: "number" },
    { key: "wip_reconciliation", label: "WIP reconciliation done", type: "boolean" },
    { key: "materials_on_time", label: "Materials ordered on time", type: "boolean" },
    { key: "callbacks", label: "Callbacks count", type: "number", target: 2 },
  ],
  office_admin: [
    { key: "quotes_sent", label: "Quotes sent", type: "number", target: 10 },
    { key: "aged_receivables_reviewed", label: "Aged receivables reviewed", type: "boolean" },
    { key: "timesheets_all_received", label: "Timesheets all received", type: "boolean" },
  ],
  coo: [
    { key: "revenue_vs_target", label: "Revenue vs $25k target", type: "number", unit: "$", target: 25000 },
    { key: "outstanding_quotes_value", label: "Outstanding quotes value", type: "number", unit: "$" },
    { key: "jobs_won_vs_quoted", label: "Jobs won vs quoted", type: "number", unit: "%" },
    { key: "cash_position", label: "Cash position", type: "number", unit: "$" },
    { key: "staff_utilisation", label: "Staff utilisation", type: "number", unit: "%", target: 85 },
    { key: "wip_schedule_reviewed", label: "WIP schedule reviewed", type: "boolean" },
  ],
  super_admin: [],
};

export const MONTHLY_CHECKS: Record<UserRole, DailyField[]> = {
  sparky: [],
  foreman: [],
  office_admin: [],
  coo: [
    { key: "gross_margin_per_job", label: "Gross margin per job", type: "number", unit: "%", target: 40 },
    { key: "callbacks_total", label: "Callbacks total", type: "number", target: 2 },
    { key: "conversion_rate", label: "Conversion rate (quotes to jobs)", type: "number", unit: "%", target: 40 },
    { key: "revenue_vs_target_final", label: "Revenue vs target (final)", type: "number", unit: "$", target: 25000 },
    { key: "subcontractor_compliance", label: "Subcontractor compliance review", type: "boolean" },
  ],
  super_admin: [],
};

const CHECKS_BY_CADENCE: Record<Cadence, Record<UserRole, DailyField[]>> = {
  daily: DAILY_CHECKS,
  weekly: WEEKLY_CHECKS,
  monthly: MONTHLY_CHECKS,
};

export function checkFieldsFor(role: UserRole | null | undefined, cadence: Cadence): DailyField[] {
  return role ? CHECKS_BY_CADENCE[cadence][role] ?? [] : [];
}

export function dailyFieldsFor(role: UserRole | null | undefined): DailyField[] {
  return checkFieldsFor(role, "daily");
}

// Which cadences a role actually has items for (drives the checklist tabs).
export function cadencesFor(role: UserRole | null | undefined): Cadence[] {
  return CADENCES.filter((c) => checkFieldsFor(role, c).length > 0);
}

// Today's date in the business timezone (NZ), as yyyy-mm-dd. en-CA formats ISO.
export function businessDate(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Pacific/Auckland" }).format(now);
}

// The period anchor date for a cadence: today / this week's Monday / month 1st.
export function periodAnchor(cadence: Cadence, now: Date = new Date()): string {
  const today = businessDate(now);
  if (cadence === "daily") return today;
  const [y, m, d] = today.split("-").map(Number);
  if (cadence === "monthly") return `${y}-${String(m).padStart(2, "0")}-01`;
  const dt = new Date(Date.UTC(y, m - 1, d));
  const dow = dt.getUTCDay() || 7;
  dt.setUTCDate(dt.getUTCDate() - (dow - 1));
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, "0")}-${String(dt.getUTCDate()).padStart(2, "0")}`;
}

// A check counts as "done" when every field is answered: booleans must be true
// (unless the good answer is false) and numbers must be present.
export function isComplete(check: DailyCheck | null, role: UserRole, cadence: Cadence = "daily"): boolean {
  if (!check) return false;
  return checkFieldsFor(role, cadence).every((f) => {
    const v = check.values[f.key];
    if (f.type === "boolean") return f.goodWhenFalse ? v === false : v === true;
    return typeof v === "number";
  });
}

export function emptyValues(role: UserRole, cadence: Cadence = "daily"): Record<string, DailyValue> {
  const out: Record<string, DailyValue> = {};
  for (const f of checkFieldsFor(role, cadence)) out[f.key] = f.type === "boolean" ? false : 0;
  return out;
}
