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
  foreman: "Operating manager",
  sparky: "Sparky",
};

export const DAILY_CHECKS: Record<UserRole, DailyField[]> = {
  sparky: [
    { key: "hours_charged", label: "Hours charged out", type: "number", unit: "h", target: 8 },
    { key: "job_cards", label: "Job cards completed", type: "number", target: 4 },
    { key: "callbacks", label: "Callbacks today", type: "number", target: 0 },
    { key: "timesheet_submitted", label: "Timesheet submitted", type: "boolean" },
    { key: "prestart_done", label: "Pre-start / safety check done", type: "boolean" },
  ],
  foreman: [
    { key: "jobs_over_budget", label: "Jobs over budget flagged", type: "number" },
    { key: "sparkies_short_hours", label: "Sparkies short on hours", type: "number" },
    { key: "crew_prestarts_reviewed", label: "Crew pre-starts reviewed", type: "boolean" },
    { key: "variations_approved", label: "Variations approved before work", type: "boolean" },
    { key: "hs_site_walk", label: "H&S site walk done", type: "boolean" },
  ],
  coo: [
    { key: "jobs_invoiced", label: "Jobs invoiced today", type: "number" },
    { key: "escalations_actioned", label: "Escalations actioned", type: "number" },
    { key: "wip_reviewed", label: "WIP / cashflow reviewed", type: "boolean" },
    { key: "revenue_checked", label: "Daily revenue checked", type: "boolean" },
  ],
  office_admin: [
    { key: "invoices_sent", label: "Invoices sent", type: "number" },
    { key: "supplier_bills", label: "Supplier bills entered", type: "number" },
    { key: "timesheets_reconciled", label: "Timesheets reconciled", type: "boolean" },
    { key: "inbox_cleared", label: "Inbox / phones cleared", type: "boolean" },
  ],
  // super_admin oversees only — no daily check of its own.
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
