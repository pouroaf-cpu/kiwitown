import ForemanDashboard from "@/app/foreman/dashboard";
import PreviewBar from "../PreviewBar";
import {
  CHECKLIST_ITEMS,
  CURRENT_YEAR,
  DAILY_DATA_FOREMAN,
  FOREMAN_HISTORY,
  KPI_ENTRIES,
  SPARKY_CONTACTS,
  WEEK_NUM,
} from "@/lib/preview/demoData";

export const dynamic = "force-static";

export default function PreviewForeman() {
  return (
    <>
      <PreviewBar role="Foreman" />
      <ForemanDashboard
        foremanName="Frankie Foreman"
        weekNum={WEEK_NUM}
        year={CURRENT_YEAR}
        existingSubmission={null}
        history={FOREMAN_HISTORY}
        checklistItems={CHECKLIST_ITEMS}
        teamEntries={KPI_ENTRIES}
        sparkies={SPARKY_CONTACTS}
        dailyPreview={DAILY_DATA_FOREMAN}
      />
    </>
  );
}
