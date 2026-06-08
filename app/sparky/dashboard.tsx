"use client";

import { createClient } from "@/lib/supabase/client";
import AppShell from "@/components/AppShell";
import KpiDashboard from "@/components/KpiDashboard";

// Shown while the data content streams in.
export function SparkySkeleton() {
  return (
    <div className="animate-pulse space-y-4 px-4 pb-28 pt-2 md:mx-auto md:max-w-5xl md:px-8" aria-hidden>
      <div className="h-40 rounded-2xl border border-border bg-white/[0.03]" />
      <div className="h-48 rounded-2xl border border-border bg-white/[0.03]" />
      <div className="h-64 rounded-2xl border border-border bg-white/[0.03]" />
    </div>
  );
}

// Static frame: AppShell only (sparky has no static page header — its content
// is data-driven). The score card + charts stream in as children.
export default function SparkyFrame({ sparkyName, children }: { sparkyName: string; children: React.ReactNode }) {
  const supabase = createClient();
  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <AppShell role="sparky" userName={sparkyName} onSignOut={signOut}>
      <div className="px-4 pt-6 md:mx-auto md:max-w-5xl md:px-8">
        <KpiDashboard role="sparky" />
      </div>
      {children}
    </AppShell>
  );
}
