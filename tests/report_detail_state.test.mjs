import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";

const clientModuleUrl = pathToFileURL(path.resolve("src/lib/api/client.ts")).href;
const reportStateModuleUrl = pathToFileURL(path.resolve("src/lib/report/detail-state.ts")).href;
const normalizeModuleUrl = pathToFileURL(path.resolve("src/lib/report/normalize-report-detail.ts")).href;

async function loadModules(seed = Date.now()) {
  const [{ ApiError }, reportState, normalize] = await Promise.all([
    import(`${clientModuleUrl}?t=${seed}`),
    import(`${reportStateModuleUrl}?t=${seed}`),
    import(`${normalizeModuleUrl}?t=${seed}`),
  ]);

  return { ApiError, ...reportState, ...normalize };
}

test("report detail success normalization", async () => {
  const { normalizeReportDetail } = await loadModules(Date.now() + 1);
  const result = normalizeReportDetail("rep_123", {
    id: "rep_123",
    title: "Revenue Trends",
    status: "ready",
    summary: "MRR is up 12% month-over-month.",
    created_at: "2026-02-10T12:00:00Z",
  });

  assert.equal(result.id, "rep_123");
  assert.equal(result.title, "Revenue Trends");
  assert.equal(result.status, "ready");
  assert.equal(result.summary, "MRR is up 12% month-over-month.");
  assert.equal(result.createdAt, "2026-02-10T12:00:00Z");
  assert.equal(result.artifactUrl, null);
  assert.equal(result.pdfUrl, null);
  assert.deepEqual(result.keySignals, []);
  assert.deepEqual(result.recommendedActions, []);
  assert.deepEqual(result.metrics, {
    netRevenue: null,
    subscribers: null,
    stabilityIndex: null,
    churnVelocity: null,
    coverageMonths: null,
    platformsConnected: null,
  });
});

test("report detail normalization supports nested payloads and pdf artifacts", async () => {
  const { normalizeReportDetail } = await loadModules(Date.now() + 11);
  const result = normalizeReportDetail("rep_nested", {
    id: "rep_nested",
    report_body: {
      executive_summary: {
        headline: "Creator revenue briefing",
        kpis: { net_revenue: 1550, subscribers: 240 },
        insights: ["Upward trend detected", "High platform dependence"],
        top_90_day_actions: ["Diversify acquisition channels"],
      },
      risk_summary: {
        stability_index: 66,
        components: { churn: 72 },
      },
      coverage: { months: 6 },
      platforms: ["patreon", "shopify"],
    },
    files: [{ type: "pdf", url: "https://cdn.example.test/reports/rep_nested.pdf" }],
  });

  assert.equal(result.summary, "Creator revenue briefing");
  assert.equal(result.artifactUrl, "https://cdn.example.test/reports/rep_nested.pdf");
  assert.equal(result.pdfUrl, "https://cdn.example.test/reports/rep_nested.pdf");
  assert.deepEqual(result.keySignals, ["Upward trend detected", "High platform dependence"]);
  assert.deepEqual(result.recommendedActions, ["Diversify acquisition channels"]);
  assert.deepEqual(result.metrics, {
    netRevenue: 1550,
    subscribers: 240,
    stabilityIndex: 66,
    churnVelocity: 72,
    coverageMonths: 6,
    platformsConnected: 2,
  });
});

test("report detail normalization supports report wrapper aliases", async () => {
  const { normalizeReportDetail } = await loadModules(Date.now() + 13);
  const result = normalizeReportDetail("rep_wrapped", {
    report: {
      summary: "Wrapped summary from report payload.",
      key_signals: ["Revenue momentum remains positive"],
      recommended_actions: ["Rebalance channel spend toward retained cohorts"],
      metrics: {
        net_revenue: "4800",
        subscribers: "530",
        stability_index: "93",
        churn_velocity: "4",
      },
      trend_preview: {
        coverage_months: "10",
        platforms_connected: "3",
      },
    },
  });

  assert.equal(result.id, "rep_wrapped");
  assert.equal(result.summary, "Wrapped summary from report payload.");
  assert.deepEqual(result.keySignals, ["Revenue momentum remains positive"]);
  assert.deepEqual(result.recommendedActions, ["Rebalance channel spend toward retained cohorts"]);
  assert.deepEqual(result.metrics, {
    netRevenue: 4800,
    subscribers: 530,
    stabilityIndex: 93,
    churnVelocity: 4,
    coverageMonths: 10,
    platformsConnected: 3,
  });
});

test("report detail normalization supports report trend preview aliases", async () => {
  const { normalizeReportDetail } = await loadModules(Date.now() + 14);
  const result = normalizeReportDetail("rep_trend", {
    report: {
      trend_preview: {
        summary: "Trend preview summary from wrapped payload.",
        key_signals: ["Subscriber growth is stabilizing"],
        recommended_actions: ["Test annual plan discount sensitivity"],
        metrics: {
          net_revenue: 3200,
          stability_index: 81,
          subscribers: 410,
          churn_velocity: 6,
        },
        coverage_months: 8,
        platforms: ["patreon", "substack"],
      },
    },
  });

  assert.equal(result.summary, "Trend preview summary from wrapped payload.");
  assert.deepEqual(result.keySignals, ["Subscriber growth is stabilizing"]);
  assert.deepEqual(result.recommendedActions, ["Test annual plan discount sensitivity"]);
  assert.deepEqual(result.metrics, {
    netRevenue: 3200,
    subscribers: 410,
    stabilityIndex: 81,
    churnVelocity: 6,
    coverageMonths: 8,
    platformsConnected: 2,
  });
});

test("report detail normalization keeps canonical route id when payload id is a sentinel", async () => {
  const { normalizeReportDetail } = await loadModules(Date.now() + 12);
  const result = normalizeReportDetail("rep_route_123", {
    id: "undefined",
    report_id: "null",
    title: "Route ID should win",
  });

  assert.equal(result.id, "rep_route_123");
  assert.equal(result.title, "Route ID should win");
});

test("report detail maps 404 to not_found", async () => {
  const { ApiError, getReportViewState } = await loadModules(Date.now() + 2);
  const error = new ApiError({ status: 404, code: "NOT_FOUND", message: "missing", operation: "report.fetch", path: "/v1/reports/1", method: "GET" });

  assert.equal(getReportViewState(error), "not_found");
});

test("report detail maps 403 FORBIDDEN to forbidden", async () => {
  const { ApiError, getReportViewState } = await loadModules(Date.now() + 3);
  const error = new ApiError({ status: 403, code: "FORBIDDEN", message: "denied", operation: "report.fetch", path: "/v1/reports/1", method: "GET" });

  assert.equal(getReportViewState(error), "forbidden");
});

test("report detail maps ENTITLEMENT_REQUIRED to entitlement_required", async () => {
  const { ApiError, getReportViewState } = await loadModules(Date.now() + 31);
  const error = new ApiError({
    status: 403,
    code: "ENTITLEMENT_REQUIRED",
    message: "Upgrade required",
    operation: "report.fetch",
    path: "/v1/reports/1",
    method: "GET",
    details: { access_reason_code: "ENTITLEMENT_REQUIRED", billing_required: true },
  });

  assert.equal(getReportViewState(error), "entitlement_required");
});

test("report detail maps 500 to server_error", async () => {
  const { ApiError, getReportViewState, getRequestId } = await loadModules(Date.now() + 4);
  const error = new ApiError({ status: 500, code: "INTERNAL", message: "boom", requestId: "req_500", operation: "report.fetch", path: "/v1/reports/1", method: "GET" });

  assert.equal(getReportViewState(error), "server_error");
  assert.equal(getRequestId(error), "req_500");
});

test("report detail maps 401 to session_expired", async () => {
  const { ApiError, getReportViewState } = await loadModules(Date.now() + 5);
  const error = new ApiError({ status: 401, code: "SESSION_EXPIRED", message: "expired", operation: "report.fetch", path: "/v1/reports/1", method: "GET" });

  assert.equal(getReportViewState(error), "session_expired");
});
