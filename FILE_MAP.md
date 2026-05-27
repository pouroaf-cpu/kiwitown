# Kiwitown KPI - File Map
_Updated by Codex, 2026-05-27_

## Project And Configuration
| File | Purpose |
| --- | --- |
| `kiwitown.md` | Current product brief and delivery requirements for Kiwitown KPI. |
| `CLAUDE.md` | Project rules, stack, environment and deployment guidance. |
| `HANDOFF.md` | Session status, migration/deployment state and remaining actions. |
| `MEMORY.md` | Durable implementation decisions and operational context. |
| `package.json` | Next.js/PWA/Supabase/Web Push dependencies and build/lint scripts. |
| `next.config.mjs` | Next.js configuration with `next-pwa` and workspace tracing root. |
| `vercel.json` | Sydney region and daily notification cron registration. |
| `.env.local.example` | Placeholder-only environment variable inventory. |

## Application Routes
| File | Purpose |
| --- | --- |
| `app/page.tsx` | Authenticated role router. |
| `app/login/page.tsx` | NZ phone OTP login and verification UI. |
| `app/pending/page.tsx` | Waiting state for authenticated users without active roles. |
| `app/coo/page.tsx`, `app/coo/dashboard.tsx` | COO operations surface for KPI entry, staff, checklist, targets, audit and reports. |
| `app/super-admin/page.tsx`, `app/super-admin/dashboard.tsx` | Owner-only branding/global configuration and role assignment. |
| `app/foreman/page.tsx`, `app/foreman/dashboard.tsx` | Weekly checklist/reflection submission, history and read-only sparky KPIs. |
| `app/sparky/page.tsx`, `app/sparky/dashboard.tsx` | Read-only personal KPI, bonus, team score and push opt-in view. |
| `app/admin/page.tsx` | Legacy redirect to `/coo`. |

## APIs And Shared Code
| File | Purpose |
| --- | --- |
| `app/api/kpi/route.ts` | KPI reads and manager-only manual monthly entry. |
| `app/api/users/route.ts` | Staff role changes and soft archive operations. |
| `app/api/weekly-submission/route.ts` | Foreman weekly submission and history access. |
| `app/api/checklist-items/route.ts` | Configurable checklist item management. |
| `app/api/targets/route.ts` | Effective-date KPI target version management. |
| `app/api/audit/route.ts` | Manager audit event listing. |
| `app/api/settings/route.ts` | Super-admin brand/global setting updates. |
| `app/api/month-end/route.ts` | Persisted month-close/reconciliation summaries. |
| `app/api/reports/bonus/route.ts` | CSV and PDF bonus exports. |
| `app/api/push/subscribe/route.ts` | Authenticated Web Push subscription persistence. |
| `app/api/notifications/run/route.ts` | Vercel cron-delivered sparky notification sender. |
| `lib/authorization.ts` | Shared server-side viewer and role authorization helper. |
| `lib/kpi.ts` | Version-aware KPI score and bonus calculation helpers. |
| `lib/types.ts` | Four-role application and database TypeScript contracts. |
| `lib/supabase/server.ts`, `lib/supabase/client.ts`, `lib/supabase/admin.ts` | Server, browser and privileged scheduled-worker Supabase clients. |

## UI, PWA And Data
| File | Purpose |
| --- | --- |
| `components/TopNav.tsx`, `components/BottomNav.tsx` | Role-aware responsive navigation. |
| `components/NotificationPrompt.tsx` | Sparky push permission and subscription action. |
| `app/globals.css`, `tailwind.config.ts`, `app/layout.tsx` | Industrial visual system, typography and app metadata. |
| `public/manifest.json`, `public/icons/icon-192x192.png`, `public/icons/icon-512x512.png` | Installable PWA branding and icons. |
| `worker/index.ts` | Custom push notification service-worker event handlers merged by `next-pwa`. |
| `middleware.ts` | Session protection and public worker/cron exceptions. |
| `supabase/migrations/001_initial.sql` | Original baseline schema. |
| `supabase/migrations/20260527083940_kpi_platform_expansion.sql` | Four-role model, configuration/audit/archive/push tables, triggers and RLS expansion. |
| `supabase/migrations/20260527084918_add_foreign_key_indexes.sql` | Advisor-requested foreign-key covering indexes. |
| `supabase/migrations/20260527091950_month_end_audit_support.sql` | Repeat month-end reconciliation policy and audit trigger. |
