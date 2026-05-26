export type UserRole = "admin" | "foreman" | "sparky";

export interface Profile {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  role: UserRole | null;
  salary: number;
  bonus_pct: number;
  created_at: string;
}

export interface WeeklySubmission {
  id: string;
  foreman_id: string;
  week_number: number;
  year: number;
  checklist: Record<string, boolean>;
  notes: Record<string, string>;
  submitted_at: string;
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
  created_at: string;
}
