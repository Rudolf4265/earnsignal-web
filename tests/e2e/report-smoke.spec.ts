import { expect, test } from "@playwright/test";
import { stubAuthenticatedSession, stubEntitlements } from "./test-helpers";

test.describe("Reports smoke", () => {
  test("report list to detail renders core analysis blocks", async ({ page }) => {
    await stubAuthenticatedSession(page);
    await stubEntitlements(page, "entitled");

    await page.route("**/v1/reports", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          items: [
            {
              report_id: "rep_smoke_001",
              status: "ready",
              title: "Smoke Report",
              created_at: "2026-03-01T10:00:00Z",
              artifact_url: "/v1/reports/rep_smoke_001/artifact",
              artifact_json_url: "https://artifacts.test/rep_smoke_001.json",
            },
          ],
          has_more: false,
          next_offset: null,
        }),
      });
    });

    await page.route("**/v1/reports/rep_smoke_001", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: "rep_smoke_001",
          title: "Smoke Report",
          status: "ready",
          summary: "Stable growth and retention.",
          created_at: "2026-03-01T10:00:00Z",
          metrics: {
            net_revenue: 215000,
            subscribers: 3800,
            stability_index: 87,
            churn_velocity: 2,
          },
          artifact_json_url: "https://artifacts.test/rep_smoke_001.json",
          artifact_url: "/v1/reports/rep_smoke_001/artifact",
        }),
      });
    });

    await page.route("https://artifacts.test/rep_smoke_001.json", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          executive_summary: ["Stable growth and retention."],
          kpis: {
            net_revenue: 215000,
            subscribers: 3800,
            stability_index: 87,
            churn_velocity: 2,
          },
        }),
      });
    });

    await page.goto("/app/report");

    const reportList = page.getByTestId("report-list");
    const emptyState = page.getByText("No reports yet");
    const hasRows = await reportList.isVisible().catch(() => false);
    const hasEmptyState = await emptyState.isVisible().catch(() => false);
    expect(hasRows || hasEmptyState).toBeTruthy();
    expect(hasRows).toBeTruthy();

    await page.getByRole("link", { name: "View" }).first().click();
    await expect(page).toHaveURL("/app/report/rep_smoke_001");

    const kpiVisible = await page.getByText("Net Revenue").isVisible().catch(() => false);
    const executiveSummaryVisible = await page.getByText("Executive Summary").isVisible().catch(() => false);
    expect(kpiVisible || executiveSummaryVisible).toBeTruthy();
  });
});
