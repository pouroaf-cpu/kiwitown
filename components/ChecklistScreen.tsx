"use client";

import { useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import AppShell from "@/components/AppShell";
import DailyCheckSection from "@/components/DailyCheckSection";
import { ROLE_LABELS } from "@/lib/dailyChecks";
import type { UserRole } from "@/lib/types";

// The standalone "Checklist" page for a role — just that role's daily check.
export default function ChecklistScreen({ role, userName }: { role: UserRole; userName: string }) {
  const supabase = useMemo(() => createClient(), []);
  async function signOut() {
    await supabase.auth.signOut();
    window.location.assign("/login");
  }
  return (
    <AppShell role={role} userName={userName} onSignOut={signOut}>
      <div className="mx-auto max-w-5xl px-5 pb-28 md:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand">Daily checklist</p>
        <h1 className="mt-3 font-display text-4xl uppercase text-white md:text-5xl">{ROLE_LABELS[role]}</h1>
        <div className="mt-8">
          <DailyCheckSection role={role} />
        </div>
      </div>
    </AppShell>
  );
}
