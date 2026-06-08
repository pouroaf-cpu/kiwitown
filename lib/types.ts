export type UserRole = "super_admin" | "coo" | "office_admin" | "foreman" | "sparky";
export type KpiType = "charge_out" | "job_cards" | "callbacks" | "timesheets_days";

export interface Profile {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole | null;
  salary: number;
  bonus_pct: number;
  active: boolean;
  archived: boolean;
  created_at: string;
  nickname?: string | null;
  avatar_url?: string | null;
}

export interface WeeklySubmission {
  id: string;
  foreman_id: string;
  week_number: number;
  year: number;
  checklist: Record<string, boolean>;
  notes: Record<string, string>;
  submitted_at: string;
  archived: boolean;
}

export interface KpiEntry {
  id: string;
  sparky_id: string;
  month: number;
  year: number;
  charge_out: number;
  job_cards: number;
  callbacks: number;
  timesheets_days: number;
  score: number;
  bonus_earned: number;
  source: "manual" | "servicem8";
  month_closed_at: string | null;
  archived: boolean;
  created_at: string;
}

export interface KpiTarget {
  id: string;
  sparky_id: string | null;
  target_type: KpiType;
  value: number;
  effective_from: string;
  effective_to: string | null;
  archived: boolean;
}

export interface ChecklistItem {
  id: string;
  label: string;
  category: string;
  colour: string;
  order_index: number;
  active: boolean;
  archived: boolean;
}

export interface AuditEvent {
  id: string;
  user_id: string | null;
  action: string;
  table_name: string;
  record_id: string | null;
  created_at: string;
}

export interface SystemSettings {
  id: string;
  business_name: string;
  logo_url: string | null;
  brand_colour: string;
  default_bonus_pct: number;
}

export type DailyValue = number | boolean | string;

export interface DailyCheck {
  id: string;
  profile_id: string;
  role: UserRole;
  check_date: string;
  values: Record<string, DailyValue>;
  note: string | null;
  created_at: string;
  updated_at: string;
}

// daily_checks row joined with the submitter's profile (for manager rollups).
export interface DailyCheckWithProfile extends DailyCheck {
  profile: { name: string; email: string; role: UserRole } | null;
}

export type CheckInputType = "yes_no" | "number" | "currency" | "date" | "time" | "text" | "photo";

// Admin-editable check definition (the item id is the value key in submissions).
export interface CheckItem {
  id: string;
  role: Exclude<UserRole, "super_admin">;
  cadence: "daily" | "weekly" | "monthly";
  label: string;
  description: string | null;
  draft: boolean;
  input_type: CheckInputType;
  target: number | null;
  unit: string | null;
  due_day: number | null;
  due_time: string | null;
  critical: boolean;
  alert_role: "coo" | "foreman" | null;
  show_on_dashboard: boolean;
  order_index: number;
  active: boolean;
  archived: boolean;
}
