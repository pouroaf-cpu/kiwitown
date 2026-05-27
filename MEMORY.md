# Kiwitown KPI - Memory

## Product Direction
- Kiwitown KPI is a mobile-first PWA for Kiwitown Electrical, with a dark industrial design and `#00AEEF` primary colour.
- Role model is `super_admin`, `coo`, `foreman`, `sparky`; legacy `admin` is replaced by `coo`.
- Authentication is Supabase phone OTP. A verified account remains pending until assigned a role.

## Architecture Decisions
- Next.js was upgraded from 14.2.35 to 15.5.18 because Next 14 had unresolved high-severity advisories during implementation.
- KPI entry is manual for phase 1 but records `source` and `external_reference` so ServiceM8 can be added without replacing the data model.
- Deletion is archive-based: operational records use `archived`; archive transitions write to `recycle_bin` with a 30-day permanent-delete date.
- COO and super-admin writes are captured by `audit_log` triggers.
- KPI targets are effective-date versions; checklist removal uses `active = false`.

## Platform State
- Supabase project: `mpggkixpvyrupmqnamgl`.
- Supabase migrations through `20260527091950_month_end_audit_support` are applied.
- Vercel project is linked under `team_YV45ydmmAkdW13akUOvAsuIO`.
- Production alias is live at `https://kiwitown.vercel.app`.
- Vercel Production contains public Supabase configuration plus VAPID and cron variables.
- Vercel now lists `SUPABASE_SERVICE_ROLE_KEY` in Production and Preview. The retained application variable name accepts the current server-only Supabase Secret key format (`sb_secret_...`) or a legacy `service_role` key; Production was redeployed with this variable on 2026-05-27.

## Verification State
- Type checking, lint, production build and npm audit pass (`npm audit`: zero vulnerabilities).
- Local visual QA confirms professional desktop/mobile OTP login rendering and unauthenticated redirect protection.
- Production checks confirm the login route, manifest and icon assets respond successfully and cron access rejects unsigned requests.
- Authenticated workflow QA still needs a real SMS OTP login and assigned role.
