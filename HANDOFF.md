# Kiwitown KPI - Agent Handoff

## Last Agent
- Agent: Codex
- Date: 2026-05-27
- Status: Application expansion deployed; scheduled push dispatch awaits one server-only Supabase secret

## Changed This Session
- Saved the build brief in `kiwitown.md`.
- Replaced email/password login with NZ phone OTP flow and role routing for `super_admin`, `coo`, `foreman`, and `sparky`.
- Added a dedicated COO operations console (`/coo`) and super-admin configuration screen (`/super-admin`).
- Rebuilt foreman and sparky dashboards to enforce read/write boundaries and support configurable targets/checklists.
- Added KPI entry, staff assignment/archive, checklist, target versioning, audit, month-end, report export, settings and push subscription APIs.
- Added PWA install icons, branded industrial UI treatment, custom push notification worker and Vercel daily cron endpoint.
- Upgraded Next.js to `15.5.18`, configured ESLint, and remediated npm advisories with zero findings from `npm audit`.

## Supabase Status
- Project URL: `https://mpggkixpvyrupmqnamgl.supabase.co`.
- Applied migrations:
  - `20260527083940_kpi_platform_expansion.sql`
  - `20260527084918_add_foreign_key_indexes.sql`
  - `20260527091950_month_end_audit_support.sql`
- Existing rows preserved; former `admin` profile values were migrated to `coo`.
- New seeded configuration: 10 active checklist items, 4 global KPI targets, 1 system settings row.
- RLS enabled on all public application tables; archive/recycle and manager audit triggers added.
- Security advisor remaining note: authenticated `get_team_score` aggregate RPC is intentionally privileged and only returns team average after active-profile validation.
- Supabase Auth advisor recommends enabling leaked password protection; application login now uses OTP, but enable it if password login is retained for any users.

## Vercel Status
- Linked project: `kiwitown` under team `team_YV45ydmmAkdW13akUOvAsuIO`.
- Live production URL: `https://kiwitown.vercel.app`.
- Production public Supabase URL and supplied publishable key configured.
- VAPID public/private key, VAPID subject and `CRON_SECRET` configured in Production.
- `SUPABASE_SERVICE_ROLE_KEY` now appears in Vercel for Production and Preview. Despite the retained compatibility name, it may contain Supabase's current server-only `sb_secret_...` key; legacy `service_role` is not required. Redeploy is required after the environment update before scheduled push dispatch can use it.

## Verification
- `npx tsc --noEmit` passes.
- `npm run lint` passes.
- `npm run build` passes with PWA custom worker generated.
- `npm audit` reports zero vulnerabilities.
- Playwright verification passed for desktop login, 390 px mobile login, and unauthenticated `/coo` redirect to `/login`.
- Live checks passed for `/login`, `/manifest.json`, PWA icon delivery, and cron authentication rejection.

## Next Steps
- Verify scheduled push dispatch after the post-environment-variable production deployment. If authorization fails, confirm `SUPABASE_SERVICE_ROLE_KEY` contains a server-only Supabase Secret key (`sb_secret_...`) or legacy `service_role` key, not the publishable browser key.
- Use the migrated COO account to assign the first `super_admin`; after one exists, only super-admin can assign owner access.
- Confirm SMS provider/phone OTP configuration in Supabase Auth and complete an end-to-end role login test.
- Trigger and verify a production push subscription/delivery after the service-role key is configured.
