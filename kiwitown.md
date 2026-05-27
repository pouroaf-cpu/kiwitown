Updated prompt — added at the top:

---

You are building a Progressive Web App called **Kiwitown KPI** for Kiwitown Electrical, a NZ electrician business. The project folder already exists at `C:\Users\PFrew\Projects\kiwitown`. Supabase is already connected.

**There is pre-existing code in this folder. You have full reign — read through it first, then edit, rewrite, or restructure anything you need to. If the existing code conflicts with what is being built here, rewrite it. The existing Supabase tables contain test data only — you can modify or recreate tables as needed.**

---

**TECH STACK**
- Next.js 14 (app router)
- TypeScript
- Tailwind CSS
- Supabase (auth + database)
- next-pwa (PWA support)
- Resend or Supabase Edge Functions for notifications

---

**BRAND**
- Background: `#0B0D12`
- Primary: `#00AEEF`
- Font: DM Sans (Google Fonts)
- Mobile-first, works on desktop too
- Sharp, clean, trade industry feel — not generic SaaS

---

**ROLES — 4 tiers**

| Role | Description |
|---|---|
| `super_admin` | System owner. Full config, white-label settings, role creation. Separate login to COO. |
| `coo` | Daniel's personal login. Full visibility, manual KPI entry, reports, month end, bonus reconciliation, edits foreman dashboard. |
| `foreman` | Submits weekly checklist + reflection notes. Read-only view of all sparky KPIs. Cannot edit anything. |
| `sparky` | Views own KPI dashboard, bonus tracker, team score. No editing. |

**Auth:** Phone number + OTP via Supabase. All routes protected. Role assigned by super_admin after first login.

---

**SCREENS**

**1. Login**
- Kiwitown branding
- Phone number entry → OTP verify
- Redirect to role-based dashboard on success

**2. Sparky Dashboard**
- Overall KPI score (weighted 0–100)
- Bonus earned vs bonus pool this month
- 4 KPI cards: Charge Out, Job Cards, Callbacks, Timesheets
- Team score
- Historical months — view any past month
- Read only — no editing

**3. Foreman Dashboard**
- Weekly checklist (10 items, grouped by category with colour coding)
- Weekly reflection notes (5 prompts, collapsible)
- Progress ring showing % complete
- Submit button — saves to Supabase
- Historical weeks — view any past submission
- Read-only view of all sparky KPIs

**4. COO Dashboard (Daniel)**
- Modern admin panel
- Manual KPI data entry per sparky per month
- Edit foreman checklist items (add/remove/reorder)
- Edit KPI categories and targets per sparky
- Full staff list — add/remove/assign roles
- Monthly overview — all sparkies, all KPIs
- Month end — stored permanently, reconcile anytime
- Export bonus report (PDF + CSV)
- Audit log — every change timestamped

**5. Super Admin**
- System configuration
- White-label settings (business name, logo, brand colour)
- Role management
- Global defaults for KPI targets and bonus structure

---

**DATABASE — Supabase tables needed**

`profiles` — id, user_id, name, phone, role, salary, bonus_pct, active, created_at

`weekly_submissions` — id, foreman_id, week_number, year, checklist (jsonb), notes (jsonb), submitted_at

`kpi_entries` — id, sparky_id, month, year, charge_out, job_cards, callbacks, timesheets_days, score, bonus_earned, created_at

`kpi_targets` — id, sparky_id (nullable = global), target_type, value, effective_from, effective_to

`checklist_items` — id, label, category, colour, order_index, active, created_at

`audit_log` — id, user_id, action, table_name, record_id, old_value (jsonb), new_value (jsonb), created_at

`recycle_bin` — id, table_name, record_id, record_data (jsonb), deleted_by, deleted_at, permanent_delete_at

---

**DATA SAFETY RULES — CRITICAL**
- Nothing ever hard deletes — everything uses `archived = true`
- 30-day soft delete recycle bin before permanent removal
- KPI targets versioned with `effective_from` and `effective_to` dates
- Checklist items use `active` flag — removing = `active = false`, history preserved
- Full audit log on every COO and super_admin action

---

**NOTIFICATIONS (push)**
- Daily KPI update notification to each sparky
- Weekly summary pushed to sparkies every Monday
- Alert when sparky drops below 70% of monthly target at day 15

---

**MANUAL KPI ENTRY (phase 1)**
- COO manually enters KPI data per sparky per month via admin panel
- ServiceM8 API integration comes in phase 2 and will replace manual entry
- Build the data model so ServiceM8 can plug straight in later without restructuring

---

**PWA**
- Installs to home screen on iPhone and Android
- Offline support via service worker
- App name: Kiwitown Electrical
- Splash screen and icons using brand colour `#00AEEF`

---

**DELIVERABLE**
- Fully working codebase pushed to GitHub
- Deployed to Vercel under team ID `team_YV45ydmmAkdW13akUOvAsuIO`
- `.env.local.example` with all required environment variable placeholders
- Give me the live Vercel URL when done

---
