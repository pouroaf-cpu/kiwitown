"use client";

import { useMemo } from "react";
import TopNav from "@/components/TopNav";
import BottomNav from "@/components/BottomNav";
import { createClient } from "@/lib/supabase/client";
import DailyCheckSection from "@/components/DailyCheckSection";
import UserManagementPanel from "@/components/UserManagementPanel";
import type { Profile } from "@/lib/types";

export default function OfficeAdminDashboard({
  viewer,
  initialStaff,
}: {
  viewer: Profile;
  initialStaff: Profile[];
}) {
  const supabase = useMemo(() => createClient(), []);
  async function signOut() {
    await supabase.auth.signOut();
    window.location.assign("/login");
  }

  return (
    <div className="industrial-grid min-h-screen pb-28 md:pb-12">
      <TopNav role="office_admin" userName={viewer.name || viewer.phone || "Office admin"} onSignOut={signOut} />
      <main className="mx-auto max-w-6xl px-5 py-7 md:px-8 md:py-10">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand">Office admin</p>
        <h1 className="mt-3 font-display text-4xl uppercase text-white md:text-5xl">Office</h1>
        <p className="mt-2 text-text-secondary">{viewer.name || viewer.phone} | daily check &amp; user settings</p>

        <div className="mt-8">
          <DailyCheckSection role="office_admin" />
        </div>
        <div className="mt-8">
          <UserManagementPanel initialStaff={initialStaff} />
        </div>
      </main>
      <BottomNav role="office_admin" />
    </div>
  );
}
