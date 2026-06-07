import type { DailyCheck, DailyValue, UserRole } from "@/lib/types";

// ---------------------------------------------------------------------------
// Daily check definitions — what each role fills in every day. A mix of
// numeric KPIs and yes/no items. This is the editable source of truth; the
// submitted answers are stored as jsonb in public.daily_checks.values, keyed
// by `key` here. Starter set — tune the labels/targets freely.
// ---------------------------------------------------------------------------

export type DailyFieldType = "number" | "boolean";

export interface DailyField {
  key: string;
  label: string;
  type: DailyFieldType;
  unit?: string; // number only, e.g. "h"
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
  // COO's checks are weekly/monthly (pending the cadence build); super_admin oversees only.
  coo: [],
  super_admin: [],
};

export function dailyFieldsFor(role: UserRole | null | undefined): DailyField[] {
  return role ? DAILY_CHECKS[role] ?? [] : [];
}

// Today's date in the business timezone (NZ), as yyyy-mm-dd. en-CA formats ISO.
export function businessDate(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Pacific/Auckland" }).format(now);
}

// A check counts as "done" when every field is answered: booleans must be true
// (unless the good answer is false) and numbers must be present.
export function isComplete(check: DailyCheck | null, role: UserRole): boolean {
  if (!check) return false;
  return dailyFieldsFor(role).every((f) => {
    const v = check.values[f.key];
    if (f.type === "boolean") return f.goodWhenFalse ? v === false : v === true;
    return typeof v === "number";
  });
}

export function emptyValues(role: UserRole): Record<string, DailyValue> {
  const out: Record<string, DailyValue> = {};
  for (const f of dailyFieldsFor(role)) out[f.key] = f.type === "boolean" ? false : 0;
  return out;
}
