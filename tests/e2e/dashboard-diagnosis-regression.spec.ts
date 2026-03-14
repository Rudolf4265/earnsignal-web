import { expect, test, type Page } from "@playwright/test";
import { stubAuthenticatedSession, stubEntitlements, stubUnhandledApiRoutes } from "./test-helpers";

const FALLBACK_TITLE = "No primary constraint identified yet";
const FALLBACK_BODY =
  "This snapshot does not contain enough structured evidence to identify a primary growth constraint yet.";
const REPORT_DETAIL_DIAGNOSIS_FALLBACK = "Typed diagnosis is unavailable for this report artifact.";
const DIAGNOSIS_TEXT = "Revenue concentration risk is the primary growth constraint.";
const DASHBOARD_WHAT_CHANGED_TEXT = "Monthly revenue grew, but platform concentration increased.";
const REPORT_WHAT_CHANGED_TEXT = "Platform concentration increased versus the prior comparable report.";

function buildCanonicalDiagnosis(summaryText = DIAGNOSIS_TEXT) {
  return {
    diagnosis_type: "concentration_pressure",
    summary_text: summaryText,
    confidence: "medium",
    evidence_strength: "moderate",
    supporting_metrics: [
      {
        metric: "concentration_risk",
        current_value: 0.68,
        prior_value: 0.59,
        direction: "up",
        confidence: "medium",
        evidence_strength: "moderate",
      },
    ],
  };
}

function buildCanonicalWhatChanged(summaryText = DASHBOARD_WHAT_CHANGED_TEXT) {
  return {
    comparison_available: true,
    prior_report_id: "rep_prior_001",
    prior_period_start: "2026-01-01",
    prior_period_end: "2026-01-31",
    comparable_metric_count: 1,
    comparison_basis_metrics: ["latest_net_revenue"],
    deltas: {
      latest_net_revenue: {
        metric: "latest_net_revenue",
        current_value: 1550,
        prior_value: 1400,
        absolute_delta: 150,
        percent_delta: 0.107,
        direction: "up",
        comparable: true,
      },
    },
    what_improved: [],
    what_worsened: [],
    watch_next: [
      {
        category: "platform",
        metric: "concentration_risk",
        change_type: "watch",
        direction: "up",
        materiality: "high",
        summary_text: summaryText,
      },
    ],
  };
}

function buildReportDetailPayload(options: {
  reportId: string;
  netRevenue?: number;
  subscribers?: number;
  diagnosis?: Record<string, unknown> | null;
  whatChanged?: Record<string, unknown> | null;
  artifactJsonUrl?: string | null;
}) {
  return {
    id: options.reportId,
    title: "Diagnosis Regression Report",
    status: "ready",
    summary: "Revenue grew this month, but concentration risk remains elevated.",
    created_at: "2026-03-09T12:00:00Z",
    artifact_url: `/v1/reports/${options.reportId}/artifact`,
    ...(options.artifactJsonUrl ? { artifact_json_url: options.artifactJsonUrl } : {}),
    report: {
      report_id: options.reportId,
      metrics: {
        net_revenue: options.netRevenue ?? 1550,
        subscribers: options.subscribers ?? 240,
        stability_index: 78,
      },
      ...(options.diagnosis ? { diagnosis: options.diagnosis } : {}),
      ...(options.whatChanged ? { what_changed: options.whatChanged } : {}),
    },
  };
}

function buildCanonicalArtifact(options: {
  reportId: string;
  diagnosis: Record<string, unknown>;
  whatChanged: Record<string, unknown>;
}) {
  return {
    schema_version: "v1",
    report: {
      report_id: options.reportId,
      created_at: "2026-03-09T12:00:00Z",
      metrics: {
        net_revenue: 1550,
        subscribers: 240,
        stability_index: 78,
      },
      diagnosis: options.diagnosis,
      what_changed: options.whatChanged,
      sections: {
        executive_summary: {
          summary: "Revenue quality improved, but platform concentration remains elevated.",
        },
        revenue_snapshot: {
          series: [
            { period: "2026-01", net_revenue: 1400 },
            { period: "2026-02", net_revenue: 1550 },
          ],
        },
        subscribers_retention: {
          items: ["Retention stayed broadly stable across the last two reporting periods."],
        },
        tier_health: {
          items: ["Core paid conversion stayed within the expected range."],
        },
        platform_mix: {
          items: ["One platform still contributes the majority of net revenue."],
        },
        clustered_themes: {
          items: ["Growth is positive, but channel concentration remains the central risk."],
        },
        stability: {
          stability_index: 78,
          items: ["Overall stability remains acceptable despite concentration pressure."],
        },
        prioritized_insights: ["Revenue growth is intact, but the business is still overexposed to one platform."],
        ranked_recommendations: ["Reduce platform concentration before increasing top-of-funnel spend."],
        outlook: {
          revenue_projection: {
            summary: "Base case remains positive if concentration risk does not worsen further.",
          },
        },
        plan: {
          items: ["Ship one channel-diversification experiment before the next report."],
        },
        appendix: {
          paragraphs: ["Method notes and assumptions."],
        },
      },
    },
  };
}

async function stubDashboardLatestReport(page: Page, payload: ReturnType<typeof buildReportDetailPayload>) {
  const reportId = payload.id;

  await page.route("**/v1/uploads/latest/status", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        upload_id: `upl_${reportId}`,
        status: "ready",
        report_id: reportId,
        updated_at: "2026-03-09T12:00:00Z",
      }),
    });
  });

  await page.route("**/v1/reports", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        items: [
          {
            report_id: reportId,
            status: "ready",
            created_at: "2026-03-09T12:00:00Z",
            artifact_url: `/v1/reports/${reportId}/artifact`,
          },
        ],
        has_more: false,
        next_offset: null,
      }),
    });
  });

  await page.route(`**/v1/reports/${reportId}`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(payload),
    });
  });
}

test.describe("Dashboard diagnosis regression", () => {
  test.beforeEach(async ({ page }) => {
    await stubAuthenticatedSession(page);
    await stubUnhandledApiRoutes(page);
    await stubEntitlements(page, "entitled");
  });

  test("renders canonical diagnosis on the dashboard when latest report detail includes it", async ({ page }) => {
    const reportId = "rep_dashboard_diagnosis_present";
    await stubDashboardLatestReport(
      page,
      buildReportDetailPayload({
        reportId,
        diagnosis: buildCanonicalDiagnosis(),
        whatChanged: buildCanonicalWhatChanged(),
      }),
    );

    await page.goto("/app");

    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
    await expect(page.getByTestId("dashboard-diagnosis-section")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Diagnosis" })).toBeVisible();
    await expect(page.getByTestId("dashboard-diagnosis-summary")).toHaveText(DIAGNOSIS_TEXT);
    await expect(page.getByTestId("dashboard-diagnosis-context")).toContainText(DASHBOARD_WHAT_CHANGED_TEXT);
    await expect(page.getByText(FALLBACK_TITLE)).toHaveCount(0);
    await expect(page.getByText(FALLBACK_BODY)).toHaveCount(0);
  });

  test("renders fallback diagnosis copy without breaking revenue snapshot when canonical diagnosis is missing", async ({ page }) => {
    const reportId = "rep_dashboard_diagnosis_absent";
    await stubDashboardLatestReport(
      page,
      buildReportDetailPayload({
        reportId,
        netRevenue: 1550,
        subscribers: 240,
      }),
    );

    await page.goto("/app");

    await expect(page.getByRole("heading", { name: "Revenue Snapshot" })).toBeVisible();
    await expect(page.getByTestId("revenue-snapshot-card-revenue")).toContainText("$1,550");
    await expect(page.getByText(FALLBACK_TITLE)).toBeVisible();
    await expect(page.getByTestId("dashboard-diagnosis-unavailable")).toHaveText(FALLBACK_BODY);
  });

  test("renders diagnosis and what-changed consistently on report detail for canonical artifact data", async ({ page }) => {
    const reportId = "rep_report_detail_diagnosis";
    const artifactJsonUrl = "https://artifacts.test/rep_report_detail_diagnosis.json";
    const diagnosis = buildCanonicalDiagnosis();
    const whatChanged = buildCanonicalWhatChanged(REPORT_WHAT_CHANGED_TEXT);

    await page.route(`**/v1/reports/${reportId}`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(
          buildReportDetailPayload({
            reportId,
            diagnosis,
            whatChanged,
            artifactJsonUrl,
          }),
        ),
      });
    });

    await page.route(artifactJsonUrl, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(
          buildCanonicalArtifact({
            reportId,
            diagnosis,
            whatChanged,
          }),
        ),
      });
    });

    await page.goto(`/app/report/${reportId}`);

    await expect(page.getByTestId("report-diagnosis-section")).toContainText(DIAGNOSIS_TEXT);
    await expect(page.getByTestId("report-what-changed-section")).toContainText(REPORT_WHAT_CHANGED_TEXT);
    await expect(page.getByText(REPORT_DETAIL_DIAGNOSIS_FALLBACK)).toHaveCount(0);
    await expect(page.getByTestId("report-what-changed-unavailable")).toHaveCount(0);
  });
});
