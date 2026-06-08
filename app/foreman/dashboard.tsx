"use client";

import { useMemo } from "react";
import AppShell from "@/components/AppShell";
import { createClient } from "@/lib/supabase/client";
import type { UserRole } from "@/lib/types";

// Shown while the data content streams in.
export function ForemanSkeleton() {
  return (
    <div className="mt-8 grid animate-pulse gap-6 lg:grid-cols-[1fr_350px]" aria-hidden>
      <div className="h-96 rounded-2xl border border-border bg-white/[0.03]" />
      <div className="h-96 rounded-2xl border border-border bg-white/[0.03]" />
    </div>
  );
}

// Static frame: AppShell + page header. Renders instantly; the weekly-check
// content (incl. the live progress ring) streams in as children.
export default function ForemanFrame({ foremanName, weekNum, year, navRole, children }: { foremanName: string; weekNum: number; year: number; navRole?: UserRole; children: React.ReactNode }) {
  const supabase = useMemo(() => createClient(), []);
  async function signOut() {
    await supabase.auth.signOut();
    window.location.assign("/login");
  }

  return (
    <AppShell role={navRole ?? "foreman"} userName={foremanName} onSignOut={signOut}>
      <main className="mx-auto max-w-6xl px-5 py-7 md:px-8 md:py-10">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand">Week {weekNum} | {year}</p>
          <h1 className="mt-3 font-display text-5xl uppercase text-white">Weekly Check</h1>
          <p className="mt-2 text-text-secondary">{foremanName} | foreman submission</p>
        </div>
        {children}
      </main>
    </AppShell>
  );
}
