import { expect, type APIRequestContext } from "@playwright/test";
import fs from "node:fs";
import { authStatePath, getApiBaseUrl, getPdfTimeoutMs, getReportRunTimeoutMs, type E2ERole } from "./env";

type ApiOptions = {
  role?: E2ERole;
  timeoutMs?: number;
};

export type NormalizedReport = {
  id: string;
  status: string;
  title?: string | null;
  artifactUrl?: string | null;
  artifactJsonUrl?: string | null;
  platformsIncluded: string[];
  sourceCount?: number | null;
  raw: Record<string, unknown>;
};

export type WorkspaceDataSources = {
  runReportEnabled: boolean;
  readySourceCount: number;
  includedSourceCount: number;
  sources: Array<{
    platform: string;
    label: string;
    state: string;
    includedInNextReport: boolean;
  }>;
  raw: Record<string, unknown>;
};

const COMPLETED_STATUSES = new Set(["ready", "completed", "complete", "success", "succeeded"]);
const FAILED_STATUSES = new Set(["failed", "error", "errored", "cancelled", "canceled"]);

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function readString(record: Record<string, unknown>, ...keys: string[]): string | null {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return null;
}

function readNumber(record: Record<string, unknown>, ...keys: string[]): number | null {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
  }

  return null;
}

function readBoolean(record: Record<string, unknown>, ...keys: string[]): boolean {
  return keys.some((key) => record[key] === true);
}

function successPayload(value: unknown): Record<string, unknown> {
  const body = asRecord(value);
  const nested = body.details ?? body.data ?? body.result;
  return nested && typeof nested === "object" && !Array.isArray(nested)
    ? { ...body, ...(nested as Record<string, unknown>) }
    : body;
}

function readStoredAccessToken(role: E2ERole): string | null {
  const statePath = authStatePath(role);
  if (!fs.existsSync(statePath)) {
    return null;
  }

  const state = JSON.parse(fs.readFileSync(statePath, "utf8")) as {
    origins?: Array<{ localStorage?: Array<{ name: string; value: string }> }>;
  };

  for (const origin of state.origins ?? []) {
    for (const item of origin.localStorage ?? []) {
      if (!item.name.startsWith("sb-") || !item.name.endsWith("-auth-token")) {
        continue;
      }

      const parsed = JSON.parse(item.value) as { access_token?: unknown };
      if (typeof parsed.access_token === "string" && parsed.access_token.trim()) {
        return parsed.access_token;
      }
    }
  }

  return null;
}

function authHeaders(options?: ApiOptions): Record<string, string> {
  if (!options?.role) {
    return {};
  }

  const token = readStoredAccessToken(options.role);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function apiUrl(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  return `${getApiBaseUrl()}${path.startsWith("/") ? "" : "/"}${path}`;
}

async function fetchJson(
  request: APIRequestContext,
  path: string,
  options?: ApiOptions & { method?: "GET" | "POST" | "PATCH"; data?: unknown },
) {
  const response = await request.fetch(apiUrl(path), {
    method: options?.method ?? "GET",
    headers: {
      Accept: "application/json",
      ...(options?.data ? { "Content-Type": "application/json" } : {}),
      ...authHeaders(options),
    },
    data: options?.data,
    timeout: options?.timeoutMs ?? 30_000,
  });

  const text = await response.text();
  const parsed = text.trim() ? JSON.parse(text) : null;
  if (!response.ok()) {
    throw new Error(`${options?.method ?? "GET"} ${path} failed with ${response.status()}: ${text.slice(0, 500)}`);
  }

  return successPayload(parsed);
}

function normalizeReport(raw: Record<string, unknown>): NormalizedReport {
  const id = readString(raw, "report_id", "reportId", "id");
  if (!id) {
    throw new Error(`Report payload did not include a usable report ID: ${JSON.stringify(raw).slice(0, 500)}`);
  }

  const platformsRaw = raw.platforms_included ?? raw.platformsIncluded ?? raw.platforms;
  const platformsIncluded = Array.isArray(platformsRaw) ? platformsRaw.filter((item): item is string => typeof item === "string") : [];

  return {
    id,
    status: readString(raw, "status") ?? "unknown",
    title: readString(raw, "title"),
    artifactUrl: readString(raw, "artifact_url", "artifactUrl", "pdf_url", "pdfUrl"),
    artifactJsonUrl: readString(raw, "artifact_json_url", "artifactJsonUrl"),
    platformsIncluded,
    sourceCount: readNumber(raw, "source_count", "sourceCount", "platform_count", "platformCount"),
    raw,
  };
}

function normalizeReportList(raw: Record<string, unknown>): NormalizedReport[] {
  const items = raw.items ?? raw.reports ?? raw.results ?? raw.data;
  return Array.isArray(items) ? items.map((item) => normalizeReport(asRecord(item))) : [];
}

export async function getWorkspaceDataSources(request: APIRequestContext, options?: ApiOptions): Promise<WorkspaceDataSources> {
  const raw = await fetchJson(request, "/v1/workspace/data-sources", options);
  const sources = Array.isArray(raw.sources)
    ? raw.sources.map((source) => {
      const record = asRecord(source);
      return {
        platform: readString(record, "platform") ?? "",
        label: readString(record, "label") ?? readString(record, "platform") ?? "",
        state: readString(record, "state") ?? "missing",
        includedInNextReport: readBoolean(record, "included_in_next_report", "includedInNextReport"),
      };
    }).filter((source) => source.platform)
    : [];

  return {
    runReportEnabled: readBoolean(raw, "run_report_enabled", "runReportEnabled"),
    readySourceCount: readNumber(raw, "ready_source_count", "readySourceCount") ?? sources.filter((source) => source.state === "ready").length,
    includedSourceCount: readNumber(raw, "included_source_count", "includedSourceCount") ?? sources.filter((source) => source.includedInNextReport).length,
    sources,
    raw,
  };
}

export async function resetWorkspaceDataSources(request: APIRequestContext, options?: ApiOptions) {
  await fetchJson(request, "/v1/workspace/clear-data", { ...options, method: "POST" });
}

export async function listReports(request: APIRequestContext, options?: ApiOptions): Promise<NormalizedReport[]> {
  return normalizeReportList(await fetchJson(request, "/v1/reports", options));
}

export async function getLatestOwnedReport(request: APIRequestContext, options?: ApiOptions): Promise<NormalizedReport> {
  const latest = (await listReports(request, options)).find((report) => report.id);
  if (!latest) {
    throw new Error("No owned report was returned by /v1/reports.");
  }

  return latest;
}

export async function getReportDetail(request: APIRequestContext, id: string, options?: ApiOptions): Promise<NormalizedReport> {
  return normalizeReport(await fetchJson(request, `/v1/reports/${encodeURIComponent(id)}`, options));
}

export async function getReportRunStatus(request: APIRequestContext, id: string, options?: ApiOptions): Promise<NormalizedReport> {
  return normalizeReport(await fetchJson(request, `/v1/reports/${encodeURIComponent(id)}/status`, options));
}

export async function waitForReportCompletion(
  request: APIRequestContext,
  id: string,
  timeoutMs = getReportRunTimeoutMs(),
  options?: ApiOptions,
): Promise<NormalizedReport> {
  const startedAt = Date.now();
  let lastStatus = "unknown";

  while (Date.now() - startedAt <= timeoutMs) {
    const status = await getReportRunStatus(request, id, options);
    lastStatus = status.status.toLowerCase();
    if (COMPLETED_STATUSES.has(lastStatus)) {
      return status;
    }
    if (FAILED_STATUSES.has(lastStatus)) {
      throw new Error(`Report ${id} failed before completion. Status: ${status.status}`);
    }

    await new Promise((resolve) => setTimeout(resolve, 5_000));
  }

  throw new Error(`Timed out after ${timeoutMs}ms waiting for report ${id} to complete. Last status: ${lastStatus}`);
}

export async function assertPdfAvailable(request: APIRequestContext, id: string, options?: ApiOptions) {
  const response = await request.get(apiUrl(`/v1/reports/${encodeURIComponent(id)}/artifact`), {
    headers: {
      Accept: "application/pdf",
      ...authHeaders(options),
    },
    timeout: options?.timeoutMs ?? getPdfTimeoutMs(),
  });

  expect(response.ok(), `PDF endpoint returned ${response.status()} for report ${id}`).toBeTruthy();
  const body = await response.body();
  expect(body.length, `PDF endpoint returned an empty artifact for report ${id}`).toBeGreaterThan(0);
  return body;
}
