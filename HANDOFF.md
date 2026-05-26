# Kiwitown Electrical — Agent Handoff

## Last Agent
- Agent: Claude Code
- Date: 2026-05-27
- Status: ✅ Desktop layout built across all three dashboards

## What Was Built This Session
### Desktop layout (all dashboards)
- `components/TopNav.tsx` (new) — desktop-only sticky top bar (`hidden md:flex`):
  - Kiwitown logo mark
  - Admin / Checklist / Sparky nav links with active-state highlight
  - Username + Sign out on the right
  - Used by admin and sparky dashboards
- `components/BottomNav.tsx` — added `md:hidden` so it only shows on mobile
- `app/admin/dashboard.tsx`:
  - TopNav for desktop; mobile header wrapped in `md:hidden`
  - Content area: `md:max-w-4xl md:mx-auto md:px-8`
  - Role/KPI bottom sheets converted to centered modals on desktop (`flex items-end md:items-center justify-center`)
  - Drag handles on modals hidden on desktop (`md:hidden`)
  - Hover states added to buttons (desktop UX)
  - Toast repositioned to top-right on desktop
- `app/sparky/dashboard.tsx`:
  - Same TopNav + mobile header pattern
  - 5-column desktop grid: score card (`col-span-2`) + 2×2 KPI cards (`col-span-3`)
  - History below, full-width
- `app/foreman/dashboard.tsx`:
  - Desktop nav replaced "Coming soon" foreman-specific items with real Admin/Checklist/Sparky `<a>` links
  - Any role (including admin previewing) can navigate between views on desktop

## Previous Session Work (2026-05-26)
### Admin dashboard — real Supabase data
- `app/admin/page.tsx` — server component; fetches admin profile, all profiles (via RPC), current month KPI entries
- `app/admin/dashboard.tsx` — Team tab + KPIs tab, role assignment, KPI entry

### Sparky dashboard — real Supabase data
- `app/sparky/page.tsx` — server component; fetches sparky profile, current month KPI entry, 6-month history
- `app/sparky/dashboard.tsx` — animated score bar, KPI cards, 6-month history

### API routes
- `app/api/users/route.ts` — GET all profiles (admin only), PATCH role assignment
- `app/api/kpi/route.ts` — POST upsert KPI entry with auto-calculated score + bonus
- `app/api/weekly-submission/route.ts` — POST + GET (upsert, idempotent; admin + foreman)

### Auth
- Login: email + password (`signInWithPassword`)
- `components/BottomNav.tsx` — Admin / Checklist / Sparky tabs (mobile only now)

## Supabase Status
- Project: mpggkixpvyrupmqnamgl.supabase.co (on separate Supabase account — MCP cannot access)
- .env.local: ✅ configured with real credentials
- SQL schema (001_initial.sql): ✅ run by user
- `admin_get_profiles` RPC: needs confirming it exists in DB (code calls it)

## Score Formula (in /api/kpi and admin dashboard preview)
- charge_out: min(value/85 × 100, 100) × 0.25
- job_cards: min(value/20 × 100, 100) × 0.25
- callbacks: max(0, (1 − value/5) × 100) × 0.25
- timesheets_days: min(value/10 × 100, 100) × 0.25
- Bonus = (score/100) × (annual_salary/12) × (bonus_pct/100)

## What's Still Needed
- [ ] **First admin user** — create user in Supabase Auth (email+password), then manually set `role='admin'` in profiles table
- [ ] **`admin_get_profiles` RPC** — confirm it exists in Supabase (the code calls `supabase.rpc("admin_get_profiles")`)
- [ ] **Vercel env vars** — confirm NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY are set in Vercel dashboard
- [ ] **PWA icons** — public/icons/icon-192x192.png + icon-512x512.png
- [ ] **Team avg on sparky dashboard** — needs SECURITY DEFINER Postgres function to read avg across all sparkies
- [ ] **Push notifications** — weekly reminders for foreman checklist
- [ ] **Clean up debug logs** — `app/page.tsx` has verbose console.error logging added for debugging

## Next Actions
- [ ] Test desktop: open kiwitown.vercel.app on a laptop, log in, navigate all three dashboards
- [ ] Set up first admin user end-to-end
- [ ] Deploy to Vercel and verify env vars
- [ ] PWA icons
