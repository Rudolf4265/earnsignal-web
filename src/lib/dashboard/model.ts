import { listReports, type ReportListItem } from "../api/reports";
import { getLatestUploadStatus, getUploadStatusById, type UploadStatus } from "../api/uploads";

export type DashboardReportItem = {
  id: string;
  title: string;
  createdAt: string;
  href: string;
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

function formatDate(value: string): string {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) {
    return value;
  }

  return date.toISOString().slice(0, 10);
}

function reportHref(report: ReportListItem): string {
  return report.artifact_url || `/app/report/${encodeURIComponent(report.report_id)}`;
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
  const recentReports = reports.slice(0, 3).map((report) => ({
    id: report.report_id,
    title: report.title || "Report",
    createdAt: formatDate(report.created_at),
    href: reportHref(report),
  }));

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

  return {
    recentReports,
    hasReports: recentReports.length > 0,
    dataStatus: {
      platformsConnected: resolvePlatforms(uploadStatus, reports),
      coverageMonths: coverage.value,
      coverageHint: coverage.hint,
      lastUpload: resolveLastUpload(uploadStatus),
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

