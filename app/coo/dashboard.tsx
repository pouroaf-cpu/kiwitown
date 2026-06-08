"use client";

import { useMemo } from "react";
import AppShell from "@/components/AppShell";
import { createClient } from "@/lib/supabase/client";
import type { Profile, UserRole } from "@/lib/types";

// Shown while the data content streams in.
export function CooSkeleton() {
  return (
    <main className="mx-auto max-w-7xl px-5 py-6 md:px-8">
      <div className="animate-pulse space-y-6" aria-hidden>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="h-24 rounded-2xl border border-border bg-white/[0.03]" />
          <div className="h-24 rounded-2xl border border-border bg-white/[0.03]" />
          <div className="h-24 rounded-2xl border border-border bg-white/[0.03]" />
        </div>
        <div className="h-64 rounded-2xl border border-border bg-white/[0.03]" />
      </div>
    </main>
  );
}

// Static frame: AppShell + page header. Renders instantly; the controls,
// KPI tabs and reconciliation content stream in as children.
export default function CooFrame({ viewer, month, year, navRole, children }: { viewer: Profile; month: number; year: number; navRole?: UserRole; children: React.ReactNode }) {
  const supabase = useMemo(() => createClient(), []);
  async function signOut() {
    await supabase.auth.signOut();
    window.location.assign("/login");
  }

  return (
    <AppShell role={navRole ?? viewer.role!} userName={viewer.name || viewer.email || viewer.phone || "COO"} onSignOut={signOut}>
      <header className="border-b border-border px-5 pb-6 pt-7 md:px-8 md:pt-10">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand">Operations control</p>
          <div className="mt-3">
            <h1 className="font-display text-5xl uppercase text-white">COO Dashboard</h1>
            <p className="mt-2 text-sm text-text-secondary">Month {month}, {year} | manual KPI capture and bonus reconciliation</p>
          </div>
        </div>
      </header>
      {children}
    </AppShell>
  );
}
