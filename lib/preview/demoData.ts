// ---------------------------------------------------------------------------
// DEMO DATA for the no-auth dashboard preview (app/login/preview/*).
// Pure hardcoded fixtures — no database, no real people. Used only to render
// each role's dashboard UI so the app can be reviewed without a working login.
// Safe to delete this whole folder (and app/login/preview) when the preview is
// no longer needed.
// ---------------------------------------------------------------------------
import type {
  AuditEvent,
  ChecklistItem,
  DailyCheckWithProfile,
  DailyValue,
  KpiEntry,
  KpiTarget,
  KpiType,
  Profile,
  SystemSettings,
  WeeklySubmission,
} from "@/lib/types";
import type { DailyData } from "@/components/DailyCheckSection";

const MONTH = 6;
const YEAR = 2026;
const NOW = "2026-06-07T02:00:00.000Z";

function profile(
  id: string,
  name: string,
  role: Profile["role"],
  extra: Partial<Profile> = {}
): Profile {
  return {
    id,
    user_id: `user-${id}`,
    name,
    email: `${name.toLowerCase().replace(/\s+/g, ".")}@kiwitown.app`,
    phone: "",
    role,
    salary: 0,
    bonus_pct: 5,
    active: true,
    archived: false,
    created_at: NOW,
    ...extra,
  };
}

// ── People ────────────────────────────────────────────────────────────────
export const SUPER_ADMIN: Profile = profile("p-super", "Sam Super", "super_admin");
export const COO: Profile = profile("p-coo", "Casey COO", "coo");
export const FOREMAN: Profile = profile("p-foreman", "Frankie Foreman", "foreman");

export const SPARKIES: Profile[] = [
  profile("p-spark-1", "Alex Wired", "sparky", { bonus_pct: 6 }),
  profile("p-spark-2", "Jordan Volt", "sparky", { bonus_pct: 5 }),
  profile("p-spark-3", "Riley Amp", "sparky", { bonus_pct: 5 }),
  profile("p-spark-4", "Morgan Ohm", "sparky", { bonus_pct: 4 }),
];

export const ALL_STAFF: Profile[] = [SUPER_ADMIN, COO, FOREMAN, ...SPARKIES];

// ── KPI targets (the 4 defaults) ────────────────────────────────────────────
export const TARGETS_RECORD: Record<KpiType, number> = {
  charge_out: 85,
  job_cards: 20,
  callbacks: 2,
  timesheets_days: 10,
};

export const KPI_TARGETS: KpiTarget[] = (
  Object.entries(TARGETS_RECORD) as [KpiType, number][]
).map(([target_type, value], i) => ({
  id: `t-${i}`,
  sparky_id: null,
  target_type,
  value,
  effective_from: "2026-01-01",
  effective_to: null,
  archived: false,
}));

// ── KPI entries for current month ───────────────────────────────────────────
function entry(
  i: number,
  sparky_id: string,
  charge_out: number,
  job_cards: number,
  callbacks: number,
  timesheets_days: number,
  score: number,
  bonus_earned: number
): KpiEntry {
  return {
    id: `k-${i}`,
    sparky_id,
    month: MONTH,
    year: YEAR,
    charge_out,
    job_cards,
    callbacks,
    timesheets_days,
    score,
    bonus_earned,
    source: "manual",
    month_closed_at: null,
    archived: false,
    created_at: NOW,
  };
}

export const KPI_ENTRIES: KpiEntry[] = [
  entry(1, "p-spark-1", 92, 24, 0, 10, 94, 640),
  entry(2, "p-spark-2", 86, 19, 1, 9, 81, 410),
  entry(3, "p-spark-3", 78, 15, 3, 8, 62, 0),
  entry(4, "p-spark-4", 88, 21, 1, 10, 86, 520),
];

// Single-sparky view (Alex Wired)
export const SPARKY_ENTRY: KpiEntry = KPI_ENTRIES[0];
export const SPARKY_HISTORY: Pick<
  KpiEntry,
  "month" | "year" | "score" | "bonus_earned"
>[] = [
  { month: 6, year: 2026, score: 94, bonus_earned: 640 },
  { month: 5, year: 2026, score: 88, bonus_earned: 540 },
  { month: 4, year: 2026, score: 91, bonus_earned: 600 },
  { month: 3, year: 2026, score: 79, bonus_earned: 320 },
  { month: 2, year: 2026, score: 84, bonus_earned: 450 },
  { month: 1, year: 2026, score: 90, bonus_earned: 580 },
];
export const TEAM_SCORE = 80.8;

// ── Checklist (the 10 seeded items) ─────────────────────────────────────────
const CHECKLIST_SEED: [string, string, string, number][] = [
  ["Pre-starts completed", "Operations", "#00AEEF", 10],
  ["Weekly operations meeting completed", "Operations", "#00AEEF", 20],
  ["Labour utilisation reviewed", "Operations", "#00AEEF", 30],
  ["Rework logged", "Quality", "#2ECC71", 40],
  ["Jobs over budget flagged", "Finance", "#F5A623", 50],
  ["Variations approved before work", "Finance", "#F5A623", 60],
  ["Back costing completed on time", "Finance", "#F5A623", 70],
  ["H&S or QA issues reported", "Safety", "#F5821F", 80],
  ["Staff coaching completed", "People", "#A78BFA", 90],
  ["Key risks escalated", "Safety", "#F5821F", 100],
];
export const CHECKLIST_ITEMS: ChecklistItem[] = CHECKLIST_SEED.map(
  ([label, category, colour, order_index], i) => ({
    id: `c-${i}`,
    label,
    category,
    colour,
    order_index,
    active: true,
    archived: false,
  })
);

// ── Audit log sample ────────────────────────────────────────────────────────
export const AUDIT_EVENTS: AuditEvent[] = [
  { id: "a-1", user_id: "user-p-coo", action: "insert", table_name: "kpi_entries", record_id: "k-1", created_at: "2026-06-06T21:30:00.000Z" },
  { id: "a-2", user_id: "user-p-coo", action: "update", table_name: "kpi_targets", record_id: "t-0", created_at: "2026-06-05T03:10:00.000Z" },
  { id: "a-3", user_id: "user-p-super", action: "update", table_name: "system_settings", record_id: "s-1", created_at: "2026-06-04T22:05:00.000Z" },
];

// ── Foreman weekly submissions ──────────────────────────────────────────────
export const WEEK_NUM = 23;

function submission(id: string, week: number, allDone: boolean): WeeklySubmission {
  const checklist: Record<string, boolean> = {};
  CHECKLIST_ITEMS.forEach((c, i) => {
    checklist[c.id] = allDone ? true : i % 3 !== 0;
  });
  return {
    id,
    foreman_id: "p-foreman",
    week_number: week,
    year: YEAR,
    checklist,
    notes: { general: "Crew tracking well; two jobs flagged over budget." },
    submitted_at: `2026-06-0${week === WEEK_NUM ? 6 : 1}T04:00:00.000Z`,
    archived: false,
  };
}

export const FOREMAN_HISTORY: WeeklySubmission[] = [
  submission("w-1", WEEK_NUM - 1, true),
  submission("w-2", WEEK_NUM - 2, false),
  submission("w-3", WEEK_NUM - 3, true),
];

export const SPARKY_CONTACTS: { id: string; name: string; email: string; phone: string }[] =
  SPARKIES.map((s) => ({ id: s.id, name: s.name, email: s.email, phone: s.phone }));

// ── System settings ─────────────────────────────────────────────────────────
export const SYSTEM_SETTINGS: SystemSettings = {
  id: "s-1",
  business_name: "Kiwitown Electrical",
  logo_url: null,
  brand_colour: "#00AEEF",
  default_bonus_pct: 5,
};

export const CURRENT_MONTH = MONTH;
export const CURRENT_YEAR = YEAR;

// ── Daily checks (today) ────────────────────────────────────────────────────
const TODAY = "2026-06-07";

function dc(p: Profile, values: Record<string, DailyValue>): DailyCheckWithProfile {
  return {
    id: `dc-${p.id}`,
    profile_id: p.id,
    role: p.role!,
    check_date: TODAY,
    values,
    note: null,
    created_at: NOW,
    updated_at: NOW,
    profile: { name: p.name, email: p.email, role: p.role! },
  };
}

// A spread of done / partial / pending so the rollup looks realistic.
const ALL_DAILY_CHECKS: DailyCheckWithProfile[] = [
  dc(SUPER_ADMIN, { invoices_sent: 12, supplier_bills: 8, timesheets_reconciled: true, inbox_cleared: true }),
  dc(COO, { jobs_invoiced: 9, escalations_actioned: 3, wip_reviewed: true, revenue_checked: true }),
  dc(FOREMAN, { jobs_over_budget: 2, sparkies_short_hours: 1, crew_prestarts_reviewed: true, variations_approved: true, hs_site_walk: true }),
  dc(SPARKIES[0], { hours_charged: 8, job_cards: 5, callbacks: 0, timesheet_submitted: true, prestart_done: true }),
  dc(SPARKIES[1], { hours_charged: 7, job_cards: 3, callbacks: 1, timesheet_submitted: true, prestart_done: false }),
  // SPARKIES[2] (Riley Amp) intentionally has no check → "Pending".
  dc(SPARKIES[3], { hours_charged: 8, job_cards: 4, callbacks: 0, timesheet_submitted: false, prestart_done: true }),
];

const ROSTER = ALL_STAFF.map((p) => ({ id: p.id, name: p.name, email: p.email, role: p.role! }));

// Mirror the API's RLS scoping so the preview matches real behaviour:
// super_admin → all values; foreman → crew values; coo → own value + status
// board; sparky → own only.
export function dailyDataFor(viewer: Profile): DailyData {
  const role = viewer.role!;
  const isForeman = role === "foreman";

  let checks: DailyCheckWithProfile[];
  if (role === "super_admin") checks = ALL_DAILY_CHECKS;
  else if (isForeman) checks = ALL_DAILY_CHECKS.filter((c) => c.role === "sparky" || c.profile_id === viewer.id);
  else checks = ALL_DAILY_CHECKS.filter((c) => c.profile_id === viewer.id); // coo, sparky → own

  let roster = ROSTER;
  if (isForeman) roster = ROSTER.filter((p) => p.role === "sparky" || p.id === viewer.id);
  else if (role === "sparky") roster = ROSTER.filter((p) => p.id === viewer.id);

  const submittedIds = new Set(ALL_DAILY_CHECKS.map((c) => c.profile_id));
  const statusRows = ROSTER.map((p) => ({
    profile_id: p.id,
    name: p.name,
    role: p.role,
    submitted: submittedIds.has(p.id),
  }));

  return { profileId: viewer.id, role, date: TODAY, checks, roster, statusRows };
}

export const DAILY_DATA_SUPER_ADMIN = dailyDataFor(SUPER_ADMIN);
export const DAILY_DATA_COO = dailyDataFor(COO);
export const DAILY_DATA_FOREMAN = dailyDataFor(FOREMAN);
export const DAILY_DATA_SPARKY = dailyDataFor(SPARKIES[0]);
