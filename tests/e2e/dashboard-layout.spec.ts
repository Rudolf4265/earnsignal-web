import { expect, test, type Page } from "@playwright/test";
import { stubAuthenticatedSession, stubEntitlements, stubUnhandledApiRoutes } from "./test-helpers";

async function wait(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function stubDashboardDataWithRecommendations(
  page: Page,
  options?: {
    reportId?: string;
    recommendedActions?: string[];
    summary?: string;
  },
) {
  const reportId = options?.reportId ?? "rep_dashboard_actions";
  const recommendedActions = options?.recommendedActions ?? ["Review churn trends by cohort and prioritize one retention experiment this week."];
  const summary = options?.summary ?? "Trend remains healthy with manageable variance.";

  await page.route("**/v1/uploads/latest/status", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        upload_id: `upl_${reportId}`,
        status: "ready",
        report_id: reportId,
        updated_at: "2026-03-08T10:00:00Z",
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
            created_at: "2026-03-08T10:00:00Z",
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
      body: JSON.stringify({
        id: reportId,
        title: "Dashboard Layout Report",
        status: "ready",
        summary,
        created_at: "2026-03-08T10:00:00Z",
        key_signals: ["Retention quality remains high."],
        recommended_actions: recommendedActions,
        metrics: {
          net_revenue: 215000,
          subscribers: 12150,
          stability_index: 88,
          churn_velocity: 12,
        },
      }),
    });
  });
}

test.describe("Dashboard layout redesign", () => {
  test.beforeEach(async ({ page }) => {
    await stubAuthenticatedSession(page);
    await stubUnhandledApiRoutes(page);
    await stubEntitlements(page, "entitled");
  });

  test("renders sections in PR2 order with simplified revenue snapshot", async ({ page }) => {
    await page.route("**/v1/uploads/latest/status", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          upload_id: "upl_dashboard_layout",
          status: "ready",
          report_id: "rep_dashboard_layout",
          updated_at: "2026-03-08T10:00:00Z",
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
              report_id: "rep_dashboard_layout",
              status: "ready",
              created_at: "2026-03-08T10:00:00Z",
              artifact_url: "/v1/reports/rep_dashboard_layout/artifact",
            },
          ],
          has_more: false,
          next_offset: null,
        }),
      });
    });

    await page.route("**/v1/reports/rep_dashboard_layout", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: "rep_dashboard_layout",
          title: "Dashboard Layout Report",
          status: "ready",
          summary: "Trend remains healthy with manageable variance.",
          created_at: "2026-03-08T10:00:00Z",
          key_signals: ["Retention quality remains high."],
          recommended_actions: ["Increase lifecycle messaging for annual plans."],
          metrics: {
            net_revenue: 215000,
            subscribers: 12150,
            stability_index: 88,
            churn_velocity: 12,
          },
        }),
      });
    });

    await page.goto("/app");
    await expect(page.getByRole("heading", { name: "Creator Health" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Revenue Snapshot" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "What We See" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "What To Do Next" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Revenue Trend" })).toBeVisible();
    await expect(page.getByText("Creator Health Score")).toBeVisible();
    await expect(page.getByTestId("revenue-snapshot-card-revenue")).toContainText("Revenue");
    await expect(page.getByTestId("revenue-snapshot-card-subscribers")).toContainText("Subscribers");
    await expect(page.getByText("Stability Index")).toHaveCount(0);
    await expect(page.getByText("Churn Velocity")).toHaveCount(0);

    const sectionOrder = await page.locator("[data-testid^='dashboard-section-']").evaluateAll((elements) =>
      elements.map((element) => element.getAttribute("data-testid")),
    );

    expect(sectionOrder).toEqual([
      "dashboard-section-creator-health",
      "dashboard-section-revenue-snapshot",
      "dashboard-section-what-we-see",
      "dashboard-section-what-to-do-next",
      "dashboard-section-revenue-trend",
    ]);
  });

  test("keeps loading and empty states after layout changes", async ({ page }) => {
    await page.route("**/v1/uploads/latest/status", async (route) => {
      await route.fulfill({
        status: 404,
        contentType: "application/json",
        body: JSON.stringify({
          status: "error",
          code: "UPLOAD_NOT_FOUND",
          message: "Upload not found",
        }),
      });
    });

    await page.route("**/v1/reports", async (route) => {
      await wait(1_000);
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          items: [],
          has_more: false,
          next_offset: null,
        }),
      });
    });

    await page.goto("/app");
    await expect(page.getByText("Loading report data...")).toBeVisible();
    await expect(page.getByText("No reports generated yet.")).toBeVisible();
    await expect(page.getByText("Charts appear once data is connected")).toBeVisible();
  });

  test("keeps dashboard refresh error banner behavior", async ({ page }) => {
    await page.route("**/v1/uploads/latest/status", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          upload_id: "upl_dashboard_error",
          status: "ready",
          report_id: "rep_dashboard_error",
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
              report_id: "rep_dashboard_error",
              status: "ready",
              created_at: "2026-03-08T10:00:00Z",
              artifact_url: "/v1/reports/rep_dashboard_error/artifact",
            },
          ],
          has_more: false,
          next_offset: null,
        }),
      });
    });

    await page.route("**/v1/reports/rep_dashboard_error", async (route) => {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({
          status: "error",
          code: "REPORT_DETAIL_FAILED",
          message: "Unable to load dashboard report detail.",
          request_id: "req_dashboard_error_001",
        }),
      });
    });

    await page.goto("/app");
    await expect(page.getByText("Data refresh failed")).toBeVisible();
    await expect(page.getByText("Unable to load dashboard report detail.")).toBeVisible();
  });

  test("renders Pro-only recommendation cards for plan_b users", async ({ page }) => {
    const proRecommendations = [
      "Scale annual plan conversion from trial cohort insights.",
      "Tighten churn win-back automations for at-risk subscriber segments.",
      "This third recommendation should not render.",
    ];

    await page.unroute("**/v1/entitlements");
    await page.route("**/v1/entitlements", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          plan: "plan_b",
          plan_tier: "plan_b",
          status: "active",
          entitled: true,
          features: {
            app: true,
            upload: true,
            report: true,
          },
        }),
      });
    });

    await stubDashboardDataWithRecommendations(page, {
      reportId: "rep_dashboard_pro",
      recommendedActions: proRecommendations,
    });

    await page.goto("/app");
    await expect(page.getByTestId("dashboard-action-cards-unlocked")).toBeVisible();
    await expect(page.getByText(proRecommendations[0])).toBeVisible();
    await expect(page.getByText(proRecommendations[1])).toBeVisible();
    await expect(page.getByText(proRecommendations[2])).toHaveCount(0);
    await expect(page.getByTestId("dashboard-action-cards-locked")).toHaveCount(0);
  });

  test("renders locked upsell state for Basic users", async ({ page }) => {
    const recommendationThatMustStayHidden = "BASIC_LEAK_CHECK_001: Never expose this recommendation in locked mode.";

    await page.unroute("**/v1/entitlements");
    await stubEntitlements(page, "unentitled");
    await stubDashboardDataWithRecommendations(page, {
      reportId: "rep_dashboard_basic",
      recommendedActions: [recommendationThatMustStayHidden],
    });

    await page.goto("/app");
    await expect(page.getByTestId("dashboard-action-cards-locked")).toBeVisible();
    await expect(page.getByText("Upgrade to Pro to unlock tailored growth recommendations based on your revenue and subscriber patterns.")).toBeVisible();
    await expect(page.getByTestId("dashboard-action-cards-unlocked")).toHaveCount(0);
    await expect(page.getByText(recommendationThatMustStayHidden)).toHaveCount(0);
  });

  test("keeps recommendation content hidden while entitlements are unresolved", async ({ page }) => {
    const delayedRecommendation = "LOADING_LEAK_CHECK_001: Do not render before entitlement resolution.";

    await page.unroute("**/v1/entitlements");
    await page.route("**/v1/entitlements", async (route) => {
      await wait(1_200);
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          plan: "plan_b",
          plan_tier: "plan_b",
          status: "active",
          entitled: true,
          features: {
            app: true,
            upload: true,
            report: true,
          },
        }),
      });
    });

    await stubDashboardDataWithRecommendations(page, {
      reportId: "rep_dashboard_loading",
      recommendedActions: [delayedRecommendation],
    });

    await page.goto("/app");
    await expect(page.getByTestId("dashboard-action-cards-loading")).toBeVisible();
    await wait(250);
    await expect(page.getByText(delayedRecommendation)).toHaveCount(0);

    await expect(page.getByTestId("dashboard-action-cards-unlocked")).toBeVisible();
    await expect(page.getByText(delayedRecommendation)).toBeVisible();
  });

  test("does not include recommendation body text in Basic-user rendered html", async ({ page }) => {
    const basicRecommendationToken = "BASIC_RENDERED_HTML_TOKEN_001";

    await page.unroute("**/v1/entitlements");
    await stubEntitlements(page, "unentitled");
    await stubDashboardDataWithRecommendations(page, {
      reportId: "rep_dashboard_basic_html",
      recommendedActions: [basicRecommendationToken],
    });

    await page.goto("/app");
    await expect(page.getByTestId("dashboard-action-cards-locked")).toBeVisible();

    const html = await page.content();
    expect(html.includes(basicRecommendationToken)).toBe(false);
  });
});
