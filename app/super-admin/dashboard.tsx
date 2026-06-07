"use client";

import { useMemo } from "react";
import AppShell from "@/components/AppShell";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/types";

// Shown while the data panels stream in. Mirrors the real panel heights so
// there's no layout shift when the data arrives.
export function SuperAdminPanelsSkeleton() {
  return (
    <div className="mt-8 animate-pulse space-y-8" aria-hidden>
      <div className="h-40 rounded-2xl border border-border bg-white/[0.03]" />
      <div className="grid gap-6 lg:grid-cols-[400px_1fr]">
        <div className="h-80 rounded-2xl border border-border bg-white/[0.03]" />
        <div className="h-80 rounded-2xl border border-border bg-white/[0.03]" />
      </div>
    </div>
  );
}

// Static frame for the super_admin settings page: AppShell + page header.
// Renders immediately (no data dependency) so the H1 — the LCP element —
// paints without waiting on Supabase. The data-dependent panels are passed in
// as `children`, streamed in via a <Suspense> boundary by the page.
export default function SuperAdminDashboard({ viewer, children }: { viewer: Profile; children: React.ReactNode }) {
  const supabase = useMemo(() => createClient(), []);

  async function signOut() {
    await supabase.auth.signOut();
    window.location.assign("/login");
  }

  return (
    <AppShell role="super_admin" userName={viewer.name || "System owner"} onSignOut={signOut}>
      <main className="mx-auto max-w-6xl px-5 py-8 md:px-8 md:py-12">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand">Platform administration</p>
        <div className="mt-3 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <h1 className="font-display text-5xl uppercase text-white">System Owner</h1>
            <p className="mt-2 text-text-secondary">White-label configuration, owner access and global defaults.</p>
          </div>
        </div>
        {children}
      </main>
    </AppShell>
  );
}
