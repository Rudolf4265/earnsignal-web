import { formatGuidanceLabelList } from "@/src/lib/upload/guidance-labels";
import { getStaticVisibleUploadPlatformCards } from "@/src/lib/upload/support-surface";
import HelpOnboardingSurface from "./_components/HelpOnboardingSurface";
import { buildHelpPlatformContent } from "./_components/help-platform-content";

export default function HelpPage() {
  const platforms = buildHelpPlatformContent(getStaticVisibleUploadPlatformCards());
  const reportDrivingSummary = formatGuidanceLabelList(
    platforms.filter((platform) => platform.reportRole === "report-driving").map((platform) => platform.name),
  );
  const supportingSummary = formatGuidanceLabelList(
    platforms.filter((platform) => platform.reportRole === "supporting").map((platform) => platform.name),
  );

  return (
    <HelpOnboardingSurface
      platforms={platforms}
      reportDrivingSummary={reportDrivingSummary}
      supportingSummary={supportingSummary}
    />
  );
}
