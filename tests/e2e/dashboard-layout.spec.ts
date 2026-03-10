import { expect, test } from "@playwright/test";
import { stubAuthenticatedSession, stubEntitlements, stubUnhandledApiRoutes } from "./test-helpers";

async function wait(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

test.describe("Dashboard layout redesign", () => {
  test.beforeEach(async ({ page }) => {
    await stubAuthenticatedSession(page);
    await stubUnhandledApiRoutes(page);
    await stubEntitlements(page, "entitled");
  });

  test("renders sections in the PR1 order", async ({ page }) => {
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
});
