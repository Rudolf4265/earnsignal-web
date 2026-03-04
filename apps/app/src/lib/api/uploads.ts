import { ApiError, apiFetchJson } from "./client";

export type UploadStatus = {
  uploadId: string | null;
  status: string | null;
  platform: string | null;
  platforms: string[];
  monthsPresent: number | null;
  lastUpdatedAt: string | null;
  createdAt: string | null;
  message: string | null;
  reportId: string | null;
};

function readString(record: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim().length > 0) {
      return value;
    }
  }

  return null;
}

function readNumber(record: Record<string, unknown>, keys: string[]): number | null {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
  }

  return null;
}

function readPlatforms(record: Record<string, unknown>): string[] {
  const list = Array.isArray(record.platforms) ? record.platforms : [];
  return list.filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0);
}

function normalizeUploadStatus(payload: unknown): UploadStatus {
  if (!payload || typeof payload !== "object") {
    return {
      uploadId: null,
      status: null,
      platform: null,
      platforms: [],
      monthsPresent: null,
      lastUpdatedAt: null,
      createdAt: null,
      message: null,
      reportId: null,
    };
  }

  const record = payload as Record<string, unknown>;
  const platforms = readPlatforms(record);
  const platform = readString(record, ["platform"]) ?? (platforms.length > 0 ? platforms[0] : null);

  return {
    uploadId: readString(record, ["upload_id", "uploadId"]),
    status: readString(record, ["status"]),
    platform,
    platforms,
    monthsPresent: readNumber(record, ["months_present", "monthsPresent"]),
    lastUpdatedAt: readString(record, ["ready_at", "readyAt", "updated_at", "updatedAt", "ingested_at", "ingestedAt"]),
    createdAt: readString(record, ["created_at", "createdAt"]),
    message: readString(record, ["message"]),
    reportId: readString(record, ["report_id", "reportId"]),
  };
}

export async function getUploadStatusById(id: string): Promise<UploadStatus> {
  const data = await apiFetchJson<Record<string, unknown>>("uploads.status", `/v1/uploads/${encodeURIComponent(id)}/status`, {
    method: "GET",
  });

  return normalizeUploadStatus(data);
}

export async function getLatestUploadStatus(): Promise<UploadStatus | null> {
  try {
    const data = await apiFetchJson<Record<string, unknown>>("uploads.latestStatus", "/v1/uploads/latest/status", {
      method: "GET",
    });
    return normalizeUploadStatus(data);
  } catch (error) {
    if (error instanceof ApiError && (error.status === 404 || error.status === 405)) {
      return null;
    }

    throw error;
  }
}

