"use client";

import { useMemo } from "react";
import AppShell from "@/components/AppShell";
import { createClient } from "@/lib/supabase/client";
import type { Profile, UserRole } from "@/lib/types";

// Shown while the data content streams in.
export function OfficeAdminSkeleton() {
  return (
    <div className="mt-8 animate-pulse space-y-8" aria-hidden>
      <div className="h-40 rounded-2xl border border-border bg-white/[0.03]" />
      <div className="h-64 rounded-2xl border border-border bg-white/[0.03]" />
    </div>
  );
}

// Static frame: AppShell + page header. Renders instantly (no data dependency);
// the data content is passed as children, streamed in via <Suspense>.
export default function OfficeAdminFrame({ viewer, navRole, children }: { viewer: Profile; navRole?: UserRole; children: React.ReactNode }) {
  const supabase = useMemo(() => createClient(), []);
  async function signOut() {
    await supabase.auth.signOut();
    window.location.assign("/login");
  }

  return (
    <AppShell role={navRole ?? "office_admin"} userName={viewer.name || viewer.phone || "Office admin"} onSignOut={signOut}>
      <main className="mx-auto max-w-6xl px-5 py-7 md:px-8 md:py-10">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand">Office admin</p>
        <h1 className="mt-3 font-display text-4xl uppercase text-white md:text-5xl">Office</h1>
        <p className="mt-2 text-text-secondary">{viewer.name || viewer.phone} | daily check &amp; user settings</p>
        {children}
      </main>
    </AppShell>
  );
}
