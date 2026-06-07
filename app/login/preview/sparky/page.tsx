import SparkyDashboard from "@/app/sparky/dashboard";
import PreviewBar from "../PreviewBar";
import {
  CURRENT_MONTH,
  CURRENT_YEAR,
  DAILY_DATA_SPARKY,
  SPARKY_ENTRIES,
  SPARKY_ENTRY,
  TARGETS_RECORD,
  TEAM_COMPLETION,
  TEAM_SCORE,
} from "@/lib/preview/demoData";

export const dynamic = "force-static";

export default function PreviewSparky() {
  return (
    <>
      <PreviewBar role="Sparky" />
      <SparkyDashboard
        sparkyName="Alex Wired"
        kpiEntry={SPARKY_ENTRY}
        entries={SPARKY_ENTRIES}
        currentMonth={CURRENT_MONTH}
        currentYear={CURRENT_YEAR}
        targets={TARGETS_RECORD}
        teamScore={TEAM_SCORE}
        dailyPreview={DAILY_DATA_SPARKY}
        teamPreview={TEAM_COMPLETION}
      />
    </>
  );
}
