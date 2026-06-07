import type { ServerClient } from "@/lib/supabase/server";
import type { KpiEntry, Profile } from "@/lib/types";
import { businessDate } from "@/lib/dailyChecks";

// Read-only "Sparky" overview for super_admin / COO. Dashboard mode = each
// sparky's current KPI score; checklist mode = each sparky's daily-check status.
export default async function SparkyRoster({
  supabase,
  mode,
}: {
  supabase: ServerClient;
  mode: "dashboard" | "checklist";
}) {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const { data: sparkies } = await supabase
    .from("profiles")
    .select("id, name, phone, email")
    .eq("role", "sparky")
    .eq("archived", false)
    .eq("active", true)
    .order("name");
  const crew = (sparkies ?? []) as Pick<Profile, "id" | "name" | "phone" | "email">[];

  let entries: KpiEntry[] = [];
  let statusIds = new Set<string>();
  if (mode === "dashboard") {
    const { data } = await supabase
      .from("kpi_entries")
      .select("*")
      .eq("month", month)
      .eq("year", year)
      .eq("archived", false);
    entries = (data ?? []) as KpiEntry[];
  } else {
    const { data } = await supabase.rpc("daily_check_status", { p_date: businessDate() });
    statusIds = new Set(((data ?? []) as { profile_id: string; submitted: boolean }[]).filter((r) => r.submitted).map((r) => r.profile_id));
  }

  const submitted = crew.filter((s) => statusIds.has(s.id)).length;

  return (
    <div className="industrial-grid min-h-screen">
      <main className="mx-auto max-w-4xl px-5 pb-28 pt-8 md:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand">Sparkies</p>
        <h1 className="mt-3 font-display text-4xl uppercase text-white md:text-5xl">
          {mode === "dashboard" ? "Crew KPIs" : "Daily checks"}
        </h1>
        {mode === "checklist" && (
          <p className="mt-2 text-text-secondary">{submitted}/{crew.length} done today</p>
        )}

        <div className="mt-8 divide-y divide-border overflow-hidden rounded-2xl border border-border">
          {crew.length === 0 && <p className="px-5 py-5 text-sm text-text-secondary">No active sparkies.</p>}
          {crew.map((s) => {
            const entry = entries.find((e) => e.sparky_id === s.id);
            const done = statusIds.has(s.id);
            return (
              <div key={s.id} className="flex items-center justify-between px-5 py-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-white">{s.name || s.phone || s.email}</p>
                  {mode === "dashboard" && entry && (
                    <p className="mt-1 text-xs text-text-secondary">
                      Charge {entry.charge_out}% · Jobs {entry.job_cards} · Callbacks {entry.callbacks}
                    </p>
                  )}
                </div>
                {mode === "dashboard" ? (
                  <span className="text-lg font-semibold text-brand">{entry ? `${entry.score}/100` : "—"}</span>
                ) : (
                  <span className={`flex items-center gap-1.5 text-xs font-semibold ${done ? "text-green-400" : "text-muted"}`}>
                    <span className={`h-2 w-2 rounded-full ${done ? "bg-green-400" : "bg-border"}`} />
                    {done ? "Done" : "Pending"}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
