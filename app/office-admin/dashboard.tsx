"use client";

import { useMemo } from "react";
import AppShell from "@/components/AppShell";
import { createClient } from "@/lib/supabase/client";
import DailyCheckSection from "@/components/DailyCheckSection";
import UserManagementPanel from "@/components/UserManagementPanel";
import type { Profile, UserRole } from "@/lib/types";

export default function OfficeAdminDashboard({
  viewer,
  initialStaff,
  showDailyCheck = true,
  navRole,
}: {
  viewer: Profile;
  initialStaff: Profile[];
  showDailyCheck?: boolean;
  navRole?: UserRole;
}) {
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

        {showDailyCheck && (
          <div className="mt-8">
            <DailyCheckSection role="office_admin" />
          </div>
        )}
        <div className="mt-8">
          <UserManagementPanel initialStaff={initialStaff} />
        </div>
      </main>
    </AppShell>
  );
}
