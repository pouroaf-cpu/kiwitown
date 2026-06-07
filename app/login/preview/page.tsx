// No-auth preview hub. Lives under /login so middleware treats it as public
// (PUBLIC_PATHS uses startsWith("/login")) — lets you walk every role's
// dashboard with demo data while login/auth is parked. Delete this folder and
// lib/preview/ to remove the preview entirely.
import Link from "next/link";

export const dynamic = "force-static";

const DASHBOARDS = [
  { href: "/login/preview/super-admin", label: "Super Admin", blurb: "Office / owner console — staff roles, settings, branding." },
  { href: "/login/preview/coo", label: "COO", blurb: "Operating manager — KPI entry, staff, checklist, targets, month-end." },
  { href: "/login/preview/foreman", label: "Foreman", blurb: "Weekly checklist submission + crew KPI overview." },
  { href: "/login/preview/sparky", label: "Sparky", blurb: "Field tech — personal monthly KPI scorecard + bonus." },
];

export default function PreviewHub() {
  return (
    <main className="min-h-screen bg-bg px-5 py-10 md:flex md:items-center md:justify-center">
      <div className="mx-auto w-full max-w-3xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-brand">Preview mode · demo data</p>
        <h1 className="mt-3 font-display text-4xl uppercase leading-tight text-white md:text-5xl">
          All dashboards
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-7 text-text-secondary">
          Each tile opens that role&apos;s real dashboard, rendered with sample data — no login required.
          Buttons that save data won&apos;t work here (there&apos;s no session); this is for viewing the UI.
        </p>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {DASHBOARDS.map((d) => (
            <Link
              key={d.href}
              href={d.href}
              className="group rounded-2xl border border-border bg-surface p-5 transition hover:border-brand/60 hover:bg-brand/5"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">{d.label}</h2>
                <span className="text-brand transition group-hover:translate-x-0.5">→</span>
              </div>
              <p className="mt-2 text-sm leading-6 text-text-secondary">{d.blurb}</p>
            </Link>
          ))}
        </div>

        <p className="mt-8 text-xs text-muted">
          Temporary preview. Remove <code className="text-text-secondary">app/login/preview/</code> and{" "}
          <code className="text-text-secondary">lib/preview/</code> before launch.
        </p>
      </div>
    </main>
  );
}
