import { apiFetchJson } from "./client";
import { normalizeReportDetail, type ReportDetail } from "../report/normalize-report-detail";
import type { ReportDetailResponseSchema } from "./generated";

export type { ReportDetail };

export async function fetchReportDetail(reportId: string): Promise<ReportDetail> {
  const data = await apiFetchJson<ReportDetailResponseSchema>("report.fetch", `/v1/reports/${encodeURIComponent(reportId)}`, {
    method: "GET",
  });

  return normalizeReportDetail(reportId, data as Record<string, unknown>);
}
