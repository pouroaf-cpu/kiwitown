# Performance Notes

Documentation of performance work on the Kiwitown KPI app, why it was needed,
and what to watch out for next.

## Symptom

The app loaded slowly on navigations and on data-heavy screens (the COO
dashboard in particular).

## Root cause: redundant auth round-trips

The database side was already well tuned — sensible indexes, RLS policies that
use `(select auth.uid())` plus a `STABLE` `private.has_role()` helper, and every
page parallelises its queries with `Promise.all`. The cost was in the
**request/auth path**, where the app paid for a Supabase Auth-server round-trip
(`supabase.auth.getUser()`) more than once per request:

- `middleware.ts` ran on every matched request and called `getUser()` — a
  network call to the Auth server (GoTrue).
- Every `/api/*` route then called `getViewer()` → `getUser()` **again** — a
  second, redundant round-trip on every API call. The dashboards fire many API
  requests, so this stacked up.
- Because API routes were not in the middleware's `PUBLIC_PATHS`, an expired
  session on an API call was `307`-redirected to the HTML `/login` page instead
  of getting the route's JSON `401` — slow *and* a latent bug.
- Logged-out traffic (login page, first visit) also paid for an Auth round-trip
  even though there was no session to validate.

## Changes made

All changes are behavior-preserving and were verified with `tsc --noEmit`,
`eslint`, and `next build`.

1. **Exclude `/api/*` from the middleware matcher** (`middleware.ts`).
   Every API route authenticates itself via `getViewer()` and returns its own
   `401`/`403` (the cron uses `CRON_SECRET`), so the middleware auth check was
   pure redundant latency. This removes one Auth round-trip from every API
   request and fixes the expired-session → HTML-redirect bug.

2. **Short-circuit middleware when no Supabase auth cookie is present**
   (`middleware.ts`). No `…-auth-token` cookie means no session, so the
   Auth-server round-trip is skipped entirely and redirect logic is applied
   directly. `getUser()` would have returned `null` anyway.

3. **Request-level dedupe of the viewer lookup** (`lib/authorization.ts`).
   `getViewer()` is wrapped in React `cache()`, so repeated reads within a
   single request reuse one auth + profile fetch instead of re-querying.

## Things to know / follow-ups

- **Region is already correct.** Vercel functions are pinned to `syd1` via
  `vercel.json` + per-route `preferredRegion`, and the Supabase project is in
  `ap-southeast-2` (Sydney), so queries are in-region. This was addressed in
  earlier commits.

- **Build depends on Supabase env vars.** `app/login/page.tsx` creates a
  Supabase browser client during render, and `/login` is statically
  prerendered, so the build needs `NEXT_PUBLIC_SUPABASE_URL` and
  `NEXT_PUBLIC_SUPABASE_ANON_KEY` at build time. These are configured for the
  **Production** environment in Vercel but **not Preview**, which is why
  branch/PR preview deployments fail to build. Production deploys (from
  `master`) are unaffected. To enable working previews, add the
  `NEXT_PUBLIC_*` vars (and the other runtime vars) to the Preview environment
  in Vercel → Project → Settings → Environment Variables.

- **Possible further win.** Landing on `/` runs `getUser()` + a profile query,
  then redirects to the role page, which runs them again. Could be deduped, but
  it only affects the initial `/` landing.
