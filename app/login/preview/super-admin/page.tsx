import SuperAdminDashboard from "@/app/super-admin/dashboard";
import PreviewBar from "../PreviewBar";
import { ALL_STAFF, DAILY_DATA_SUPER_ADMIN, SUPER_ADMIN, SYSTEM_SETTINGS } from "@/lib/preview/demoData";

export const dynamic = "force-static";

export default function PreviewSuperAdmin() {
  return (
    <>
      <PreviewBar role="Super Admin" />
      <SuperAdminDashboard
        viewer={SUPER_ADMIN}
        initialSettings={SYSTEM_SETTINGS}
        initialStaff={ALL_STAFF}
        dailyPreview={DAILY_DATA_SUPER_ADMIN}
      />
    </>
  );
}
