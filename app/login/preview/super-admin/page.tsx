import SuperAdminDashboard from "@/app/super-admin/dashboard";
import SuperAdminPanels from "@/app/super-admin/panels";
import PreviewBar from "../PreviewBar";
import { ALL_STAFF, DAILY_DATA_SUPER_ADMIN, SUPER_ADMIN, SYSTEM_SETTINGS } from "@/lib/preview/demoData";

export const dynamic = "force-static";

export default function PreviewSuperAdmin() {
  return (
    <>
      <PreviewBar role="Super Admin" />
      <SuperAdminDashboard viewer={SUPER_ADMIN}>
        <SuperAdminPanels
          initialSettings={SYSTEM_SETTINGS}
          initialStaff={ALL_STAFF}
          dailyPreview={DAILY_DATA_SUPER_ADMIN}
        />
      </SuperAdminDashboard>
    </>
  );
}
