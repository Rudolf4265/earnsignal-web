import { apiFetchJson } from "./client";
import { normalizeReportDetail, type ReportDetail } from "../report/normalize-report-detail";

export type { ReportDetail };

export async function fetchReportDetail(reportId: string): Promise<ReportDetail> {
  const data = await apiFetchJson<Record<string, unknown>>("report.fetch", `/v1/reports/${encodeURIComponent(reportId)}`, {
    method: "GET",
  });

  return normalizeReportDetail(reportId, data);
}
