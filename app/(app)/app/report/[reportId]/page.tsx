import { ReportDetailClient } from "./report-detail-client";

export default async function ReportPage({ params }: { params: Promise<{ reportId: string }> }) {
  const { reportId } = await params;
  return <ReportDetailClient reportId={reportId} />;
}
