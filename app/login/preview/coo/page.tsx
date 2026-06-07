import CooDashboard from "@/app/coo/dashboard";
import PreviewBar from "../PreviewBar";
import {
  ALL_STAFF,
  AUDIT_EVENTS,
  CHECKLIST_ITEMS,
  COO,
  CURRENT_MONTH,
  CURRENT_YEAR,
  DAILY_DATA_COO,
  KPI_ENTRIES,
  KPI_TARGETS,
} from "@/lib/preview/demoData";

export const dynamic = "force-static";

export default function PreviewCoo() {
  return (
    <>
      <PreviewBar role="COO" />
      <CooDashboard
        viewer={COO}
        initialStaff={ALL_STAFF}
        initialEntries={KPI_ENTRIES}
        initialChecklist={CHECKLIST_ITEMS}
        initialTargets={KPI_TARGETS}
        initialAudit={AUDIT_EVENTS}
        month={CURRENT_MONTH}
        year={CURRENT_YEAR}
        dailyPreview={DAILY_DATA_COO}
      />
    </>
  );
}
