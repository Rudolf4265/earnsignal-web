#!/usr/bin/env node

const DEFAULT_TIMEOUT_MS = 15_000;

function getEnv(name, required = false) {
  const value = process.env[name]?.trim();
  if (!value && required) {
    throw new Error(`Missing ${name}`);
  }
  return value || null;
}

function buildUrl(baseUrl, path) {
  const normalized = baseUrl.replace(/\/+$/, "");
  return `${normalized}${path.startsWith("/") ? "" : "/"}${path}`;
}

function summarizeKeys(payload) {
  if (!payload || typeof payload !== "object") {
    return [];
  }

  return Object.keys(payload);
}

function pickReportId(listPayload) {
  if (!listPayload || typeof listPayload !== "object") {
    return null;
  }

  const items = Array.isArray(listPayload.items) ? listPayload.items : [];
  for (const item of items) {
    if (!item || typeof item !== "object") continue;
    const id = item.report_id ?? item.reportId ?? item.id;
    if (typeof id === "string" && id.trim()) {
      return id.trim();
    }
  }

  return null;
}

async function requestTimelineEntry(baseUrl, path, token) {
  const url = buildUrl(baseUrl, path);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);
  const startedAt = Date.now();

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      signal: controller.signal,
    });

    const text = await response.text();
    let parsed = null;
    try {
      parsed = text ? JSON.parse(text) : null;
    } catch {
      parsed = { parse_error: "invalid_json", raw_preview: text.slice(0, 200) };
    }

    return {
      endpoint: path,
      status: response.status,
      duration_ms: Date.now() - startedAt,
      request_id: response.headers.get("x-request-id") ?? (parsed && typeof parsed === "object" ? parsed.request_id ?? null : null),
      top_level_keys: summarizeKeys(parsed),
      report_sample: Array.isArray(parsed?.items)
        ? parsed.items.slice(0, 3).map((item) => {
            if (!item || typeof item !== "object") return item;
            return {
              report_id: item.report_id ?? item.reportId ?? item.id ?? null,
              status: item.status ?? null,
              artifact_url_present: Boolean(typeof item.artifact_url === "string" && item.artifact_url.trim()),
            };
          })
        : undefined,
      payload: parsed,
    };
  } catch (error) {
    return {
      endpoint: path,
      status: "NETWORK_ERROR",
      duration_ms: Date.now() - startedAt,
      error: error instanceof Error ? error.message : String(error),
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function main() {
  const baseUrl = getEnv("NEXT_PUBLIC_API_BASE_URL", true);
  const token = getEnv("AUDIT_BEARER_TOKEN") ?? getEnv("AUTH_TOKEN") ?? null;

  const timeline = [];
  const entitlements = await requestTimelineEntry(baseUrl, "/v1/entitlements", token);
  timeline.push(entitlements);

  const reports = await requestTimelineEntry(baseUrl, "/v1/reports?limit=25&offset=0", token);
  timeline.push(reports);

  const reportId = pickReportId(reports.payload);
  if (reportId) {
    const detail = await requestTimelineEntry(baseUrl, `/v1/reports/${encodeURIComponent(reportId)}`, token);
    timeline.push(detail);
  }

  const summary = {
    generated_at: new Date().toISOString(),
    base_url: baseUrl,
    token_supplied: Boolean(token),
    endpoints_called: timeline.map((entry) => ({ endpoint: entry.endpoint, status: entry.status, duration_ms: entry.duration_ms })),
    timeline,
  };

  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error("[frontend-api-timeline] fatal", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
