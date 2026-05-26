# Kiwitown Electrical — Agent Handoff

## Last Agent
- Agent: Claude Code
- Date: 2026-05-26
- Status: ✅ Admin + Sparky dashboards wired to Supabase; all API routes built

## What Was Built This Session
### Admin dashboard — real Supabase data
- `app/admin/page.tsx` — server component; fetches admin profile, all profiles, current month KPI entries
- `app/admin/dashboard.tsx` — client component:
  - Two tabs: Team | KPIs
  - Team tab: stats row (total/foremen/sparkies), full user list with tappable role badges
  - Role assignment bottom sheet: pick admin/foreman/sparky/none → PATCH /api/users
  - KPIs tab: month navigation (prev/next), sparky list with score bars + bonus
  - KPI entry bottom sheet: 4 fields (charge out %, job cards, callbacks, timesheets days), live score preview, POST /api/kpi
  - Toast notifications, sign out

### Sparky dashboard — real Supabase data
- `app/sparky/page.tsx` — server component; fetches sparky profile, current month KPI entry, 6-month history
- `app/sparky/dashboard.tsx` — client component:
  - Animated score bar (CSS transition on mount)
  - Score /100 + bonus earned (green)
  - 4 KPI cards: real values, status dot (green/yellow/red vs targets), target labels
  - 6-month history bar chart (score + bonus per month)
  - "No data yet" state with explanation
  - Sign out

### API routes
- `app/api/users/route.ts` — GET all profiles (admin only), PATCH role assignment
- `app/api/kpi/route.ts` — POST upsert KPI entry with auto-calculated score + bonus (admin only), GET for sparky own history or admin all

### Type fix
- `lib/types.ts` — `Profile.role` changed from `UserRole` to `UserRole | null` (DB column is nullable)

## Supabase Status
- Project: mpggkixpvyrupmqnamgl.supabase.co (on separate Supabase account — MCP cannot access)
- .env.local: ✅ configured with real credentials
- SQL schema (001_initial.sql): ✅ run by user
- Phone Auth: ❓ needs enabling in Supabase → Authentication → Providers → Phone
- Vercel env vars: ❓ needs confirming

## Score Formula (in /api/kpi and admin dashboard preview)
- charge_out: min(value/85 × 100, 100) × 0.25
- job_cards: min(value/20 × 100, 100) × 0.25
- callbacks: max(0, (1 − value/5) × 100) × 0.25
- timesheets_days: min(value/10 × 100, 100) × 0.25
- Bonus = (score/100) × (annual_salary/12) × (bonus_pct/100)

## What's Still Needed
- [ ] Enable Phone Auth in Supabase → Authentication → Providers → Phone
- [ ] Add Supabase credentials to Vercel environment variables (if not done)
- [ ] Generate/add PWA icons: public/icons/icon-192x192.png + icon-512x512.png
- [ ] First admin user: after signing in with phone OTP, manually set role='admin' in Supabase Table Editor → profiles
- [ ] Team avg score on sparky dashboard (needs a SECURITY DEFINER Postgres function — currently shows individual data only due to RLS)

## Next Actions
- [ ] Enable Phone Auth (biggest functional unblock)
- [ ] Set first admin manually in Supabase Table Editor
- [ ] Test end-to-end: login → admin assigns roles → admin enters KPIs → sparky sees their score
- [ ] Push notifications for weekly reminders (Supabase Edge Functions or Vercel Cron)
- [ ] PWA icons
