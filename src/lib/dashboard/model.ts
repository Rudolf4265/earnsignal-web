import { listReports, normalizeReportId, type ReportListItem } from "../api/reports";
import { getLatestUploadStatus, getUploadStatusById, type UploadStatus } from "../api/uploads";
import { getReportHref, isReportViewable } from "../report/viewability";

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
  dataStatus: {
    platformsConnected: string;
    coverageMonths: string;
    coverageHint: string | null;
    lastUpload: string;
  };
};

type DashboardModelDeps = {
  listReports: typeof listReports;
  getUploadStatusById: typeof getUploadStatusById;
  getLatestUploadStatus: typeof getLatestUploadStatus;
  readLastUploadId?: () => string | null;
};

const DEBUG_AUDIT_FRONTEND = process.env.NEXT_PUBLIC_DEBUG_AUDIT_FRONTEND === "1" || process.env.NODE_ENV !== "production";

function debugDashboard(message: string, details: Record<string, unknown>) {
  if (!DEBUG_AUDIT_FRONTEND) {
    return;
  }

  console.debug(`[audit:dashboard] ${message}`, details);
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) {
    return value;
  }

  return date.toISOString().slice(0, 10);
}

function sortByCreatedAtDesc(a: ReportListItem, b: ReportListItem): number {
  const aTime = new Date(a.created_at).getTime();
  const bTime = new Date(b.created_at).getTime();
  return (Number.isFinite(bTime) ? bTime : 0) - (Number.isFinite(aTime) ? aTime : 0);
}

function resolvePlatforms(uploadStatus: UploadStatus | null, reports: ReportListItem[]): string {
  const uploadPlatforms = uploadStatus?.platforms.length ? uploadStatus.platforms : uploadStatus?.platform ? [uploadStatus.platform] : [];
  const reportPlatforms = reports.flatMap((item) => item.platforms ?? []);
  const joined = Array.from(new Set([...uploadPlatforms, ...reportPlatforms].map((item) => item.trim()).filter(Boolean)));

  if (joined.length === 0) {
    return "None (upload to connect)";
  }

  return joined.join(", ");
}

function resolveLastUpload(uploadStatus: UploadStatus | null): string {
  const timestamp = uploadStatus?.lastUpdatedAt ?? uploadStatus?.createdAt;
  if (!timestamp) {
    return "—";
  }

  return formatDate(timestamp);
}

function resolveCoverage(uploadStatus: UploadStatus | null): { value: string; hint: string | null } {
  if (typeof uploadStatus?.monthsPresent === "number") {
    return {
      value: `${uploadStatus.monthsPresent} months`,
      hint: null,
    };
  }

  return {
    value: "—",
    hint: "Available after first report",
  };
}

export async function buildDashboardModelWithDeps(deps: DashboardModelDeps): Promise<DashboardViewModel> {
  const reportsResponse = await deps.listReports({ limit: 25, offset: 0 });
  const reports = [...reportsResponse.items].sort(sortByCreatedAtDesc);
  const recentReports = reports.slice(0, 3).map((report, index) => {
    const id = normalizeReportId(report);
    const href = getReportHref(report);
    const canView = isReportViewable(report);

    debugDashboard("report-row-derived", {
      report_id: id,
      status: report.status,
      artifact_url_present: Boolean(typeof report.artifact_url === "string" && report.artifact_url.trim()),
      href,
      canView,
    });

    return {
      id: id ?? `report-${index}`,
      title: report.title || "Report",
      createdAt: formatDate(report.created_at),
      href: href ?? "#",
      canView,
    };
  });

  let uploadStatus: UploadStatus | null = null;
  const lastUploadId = deps.readLastUploadId?.() ?? null;
  if (lastUploadId) {
    try {
      uploadStatus = await deps.getUploadStatusById(lastUploadId);
    } catch {
      uploadStatus = null;
    }
  }

  if (!uploadStatus) {
    uploadStatus = await deps.getLatestUploadStatus();
  }

  const coverage = resolveCoverage(uploadStatus);
  const platformsConnected = resolvePlatforms(uploadStatus, reports);
  const lastUpload = resolveLastUpload(uploadStatus);

  debugDashboard("model-derived", {
    reportCount: reports.length,
    hasReports: recentReports.length > 0,
    coverageMonths: coverage.value,
    coverageHint: coverage.hint,
    platformsConnected,
    lastUpload,
  });

  return {
    recentReports,
    hasReports: recentReports.length > 0,
    dataStatus: {
      platformsConnected,
      coverageMonths: coverage.value,
      coverageHint: coverage.hint,
      lastUpload,
    },
  };
}

export async function buildDashboardModel(params?: { readLastUploadId?: () => string | null }): Promise<DashboardViewModel> {
  return buildDashboardModelWithDeps({
    listReports,
    getUploadStatusById,
    getLatestUploadStatus,
    readLastUploadId: params?.readLastUploadId,
  });
}
