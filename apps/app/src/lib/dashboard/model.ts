import { getReport, listReports, normalizeReportId, type ReportListItem } from "../api/reports";
import { getLatestUploadStatus, getUploadStatusById, type UploadStatus } from "../api/uploads";
import { getReportHref, isReportViewable } from "../report/viewability";
import { createClient } from "../supabase/client";
import { ApiError, getApiBaseOrigin } from "../api/client";
import { fetchReportJsonArtifact } from "../report/artifacts";

export type DashboardReportItem = {
  id: string;
  title: string;
  createdAt: string;
  href: string;
  canView: boolean;
};

export type DashboardViewModel = {
  recentReports: DashboardReportItem[];
  hasReports: boolean;
  reportDataError: boolean;
  reportDataDiagnostics?: string;
  reportDataRequestId?: string;
  kpis: {
    netRevenue: string;
    subscribers: string;
    stabilityIndex: string;
    churnVelocity: string;
  };
  dataStatus: {
    platformsConnected: string;
    coverageMonths: string;
    coverageHint: string | null;
    lastUpload: string;
  };
};

type DashboardModelDeps = {
  listReports: typeof listReports;
  getReport: typeof getReport;
  getUploadStatusById: typeof getUploadStatusById;
  getLatestUploadStatus: typeof getLatestUploadStatus;
  fetchReportJsonArtifact: typeof fetchReportJsonArtifact;
  getAccessToken: () => Promise<string | null>;
  readLastUploadId?: () => string | null;
};

const DEBUG_AUDIT_FRONTEND = process.env.NEXT_PUBLIC_DEBUG_AUDIT_FRONTEND === "1" || process.env.NODE_ENV !== "production";

function debugDashboard(message: string, details: Record<string, unknown>) {
  if (!DEBUG_AUDIT_FRONTEND) return;
  console.debug(`[audit:dashboard] ${message}`, details);
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return value;
  return date.toISOString().slice(0, 10);
}

function sortByCreatedAtDesc(a: ReportListItem, b: ReportListItem): number {
  const aTime = new Date(a.created_at).getTime();
  const bTime = new Date(b.created_at).getTime();
  return (Number.isFinite(bTime) ? bTime : 0) - (Number.isFinite(aTime) ? aTime : 0);
}

function asDisplay(value: unknown): string {
  if (typeof value === "number" && Number.isFinite(value)) return `${value}`;
  if (typeof value === "string" && value.trim()) return value;
  return "—";
}

function readPath(payload: Record<string, unknown>, paths: string[][]): unknown {
  for (const path of paths) {
    let current: unknown = payload;
    let ok = true;
    for (const key of path) {
      if (!current || typeof current !== "object" || !(key in (current as Record<string, unknown>))) {
        ok = false;
        break;
      }
      current = (current as Record<string, unknown>)[key];
    }
    if (ok) return current;
  }
  return undefined;
}

function extractKpis(payload: Record<string, unknown>) {
  return {
    netRevenue: asDisplay(readPath(payload, [["kpis", "net_revenue"], ["net_revenue"], ["summary", "net_revenue"]])),
    subscribers: asDisplay(readPath(payload, [["kpis", "subscribers"], ["subscribers"], ["summary", "subscribers"]])),
    stabilityIndex: asDisplay(readPath(payload, [["kpis", "stability_index"], ["stability_index"]])),
    churnVelocity: asDisplay(readPath(payload, [["kpis", "churn_velocity"], ["churn_velocity"]])),
  };
}

function resolvePlatforms(uploadStatus: UploadStatus | null, reports: ReportListItem[]): string {
  const uploadPlatforms = uploadStatus?.platforms.length ? uploadStatus.platforms : uploadStatus?.platform ? [uploadStatus.platform] : [];
  const reportPlatforms = reports.flatMap((item) => item.platforms ?? []);
  const joined = Array.from(new Set([...uploadPlatforms, ...reportPlatforms].map((item) => item.trim()).filter(Boolean)));
  if (joined.length === 0) return "None (upload to connect)";
  return joined.join(", ");
}

function resolveLastUpload(uploadStatus: UploadStatus | null): string {
  const timestamp = uploadStatus?.lastUpdatedAt ?? uploadStatus?.createdAt;
  if (!timestamp) return "—";
  return formatDate(timestamp);
}

function safeApiBaseOrigin(): string | undefined {
  try {
    return getApiBaseOrigin();
  } catch {
    return undefined;
  }
}

function resolveCoverage(uploadStatus: UploadStatus | null): { value: string; hint: string | null } {
  if (typeof uploadStatus?.monthsPresent === "number") return { value: `${uploadStatus.monthsPresent} months`, hint: null };
  return { value: "—", hint: "Available after first report" };
}

export async function buildDashboardModelWithDeps(deps: DashboardModelDeps): Promise<DashboardViewModel> {
  const reportsResponse = await deps.listReports({ limit: 25, offset: 0 });
  const reports = [...reportsResponse.items].sort(sortByCreatedAtDesc);

  const recentReports = reports.slice(0, 3).map((report, index) => {
    const id = normalizeReportId(report);
    const href = getReportHref(report);
    const canView = isReportViewable(report);
    return { id: id ?? `report-${index}`, title: report.title || "Report", createdAt: formatDate(report.created_at), href: href ?? "#", canView };
  });

  let kpis = {
    netRevenue: "—",
    subscribers: "—",
    stabilityIndex: "—",
    churnVelocity: "—",
  };
  let reportDataError = false;
  let reportDataDiagnostics: string | undefined;
  let reportDataRequestId: string | undefined;

  const latestReady = reports.find((item) => item.status === "ready" && normalizeReportId(item));
  if (latestReady) {
    try {
      const reportId = normalizeReportId(latestReady)!;
      const detail = await deps.getReport(reportId);
      const artifactJsonUrl = latestReady.artifact_json_url ?? detail.artifactJsonUrl;
      const token = await deps.getAccessToken();
      if (!artifactJsonUrl) {
        debugDashboard("kpi-hydration-skipped", { reason: "artifact_json_url_missing", reportId });
      } else if (token) {
        const payload = await deps.fetchReportJsonArtifact({ artifactJsonUrl, token, origin: safeApiBaseOrigin() });
        kpis = extractKpis(payload);
      } else {
        reportDataError = true;
        reportDataDiagnostics = "Authentication required to hydrate dashboard from JSON artifact.";
      }
    } catch (error) {
      reportDataError = true;
      if (error instanceof ApiError) {
        reportDataRequestId = error.requestId;
        const detailContentType =
          error.details && typeof error.details === "object" && "contentType" in error.details
            ? String((error.details as Record<string, unknown>).contentType ?? "unknown")
            : undefined;

        reportDataDiagnostics =
          error.code === "UNEXPECTED_CONTENT_TYPE"
            ? `JSON artifact fetch returned ${error.status} (${detailContentType ?? "unknown content-type"}).`
            : `JSON artifact fetch failed with status ${error.status}.`;
      } else {
        reportDataDiagnostics = "JSON artifact fetch failed unexpectedly.";
      }
    }
  }

  let uploadStatus: UploadStatus | null = null;
  const lastUploadId = deps.readLastUploadId?.() ?? null;
  if (lastUploadId) {
    try { uploadStatus = await deps.getUploadStatusById(lastUploadId); } catch { uploadStatus = null; }
  }
  if (!uploadStatus) uploadStatus = await deps.getLatestUploadStatus();

  const coverage = resolveCoverage(uploadStatus);
  const platformsConnected = resolvePlatforms(uploadStatus, reports);
  const lastUpload = resolveLastUpload(uploadStatus);

  debugDashboard("model-derived", { reportCount: reports.length, hasReports: recentReports.length > 0, reportDataError, kpis });

  return {
    recentReports,
    hasReports: recentReports.length > 0,
    reportDataError,
    reportDataDiagnostics,
    reportDataRequestId,
    kpis,
    dataStatus: { platformsConnected, coverageMonths: coverage.value, coverageHint: coverage.hint, lastUpload },
  };
}

export async function buildDashboardModel(params?: { readLastUploadId?: () => string | null }): Promise<DashboardViewModel> {
  return buildDashboardModelWithDeps({
    listReports,
    getReport,
    getUploadStatusById,
    getLatestUploadStatus,
    fetchReportJsonArtifact,
    getAccessToken: async () => {
      const { data } = await createClient().auth.getSession();
      return data.session?.access_token ?? null;
    },
    readLastUploadId: params?.readLastUploadId,
  });
}
