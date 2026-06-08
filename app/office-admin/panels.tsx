"use client";

import DailyCheckSection from "@/components/DailyCheckSection";
import UserManagementPanel from "@/components/UserManagementPanel";
import type { Profile } from "@/lib/types";

// Data-dependent content for the office-admin dashboard. Rendered inside a
// <Suspense> boundary so the static frame can paint first.
export default function OfficeAdminPanels({ initialStaff, showDailyCheck = true }: { initialStaff: Profile[]; showDailyCheck?: boolean }) {
  return (
    <>
      {showDailyCheck && (
        <div className="mt-8">
          <DailyCheckSection role="office_admin" />
        </div>
      )}
      <div className="mt-8">
        <UserManagementPanel initialStaff={initialStaff} />
      </div>
    </>
  );
}
