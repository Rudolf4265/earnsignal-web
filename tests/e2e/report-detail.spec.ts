import { expect, test } from "@playwright/test";
import { stubAuthenticatedSession, stubEntitlements, stubUnhandledApiRoutes } from "./test-helpers";

test.describe("Report detail route", () => {
  test.beforeEach(async ({ page }) => {
    await stubAuthenticatedSession(page);
    await stubUnhandledApiRoutes(page);
    await stubEntitlements(page, "entitled");
  });

  test("renders completed reports in the normal report layout", async ({ page }) => {
    await page.route("**/v1/reports/rep_success", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: "rep_success",
          title: "Q1 Revenue Quality",
          status: "ready",
          summary: "Healthy growth with stable churn.",
          created_at: "2026-03-01T10:00:00Z",
          artifact_json_url: "https://artifacts.test/rep_success.json",
          artifact_url: "/v1/reports/rep_success/artifact",
        }),
      });
    });

    await page.route("https://artifacts.test/rep_success.json", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          report: {
            report_id: "rep_success",
            schema_version: "v1",
            sections: {
              executive_summary: {
                summary: "Healthy growth with stable churn.",
              },
              prioritized_insights: {
                items: ["Revenue quality improved while churn pressure stayed controlled."],
              },
              ranked_recommendations: {
                items: ["Keep the current pricing posture while compounding retention gains."],
              },
            },
          },
        }),
      });
    });

    await page.goto("/app/report/rep_success");

    await expect(page).toHaveURL("/app/report/rep_success");
    await expect(page.getByTestId("report-content")).toBeVisible();
    await expect(page.getByTestId("report-executive-summary-card")).toBeVisible();
    await expect(page.getByText("Healthy growth with stable churn.").first()).toBeVisible();
    await expect(page.getByText("Ready")).toBeVisible();
    await expect(page.getByTestId("report-running")).toHaveCount(0);
    await expect(page.getByTestId("report-failed")).toHaveCount(0);
    await expect(page.getByTestId("nav-reports")).toHaveAttribute("aria-current", "page");
  });

  for (const fixture of [
    { id: "rep_running", status: "running", sourceCount: 3, platforms: ["Patreon", "Shopify", "YouTube"] },
    { id: "rep_queued", status: "queued", sourceCount: 2, platforms: ["Patreon", "Substack"] },
  ]) {
    test(`renders the building screen for ${fixture.status} reports`, async ({ page }) => {
      await page.route(`**/v1/reports/${fixture.id}/status`, async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            report_id: fixture.id,
            status: fixture.status,
            updated_at: "2026-03-01T10:02:00Z",
          }),
        });
      });

      await page.route(`**/v1/reports/${fixture.id}`, async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            id: fixture.id,
            title: "Combined Report",
            status: fixture.status,
            created_at: "2026-03-01T10:00:00Z",
            source_count: fixture.sourceCount,
            platforms_included: fixture.platforms,
          }),
        });
      });

      await page.goto(`/app/report/${fixture.id}`);

      await expect(page).toHaveURL(`/app/report/${fixture.id}`);
      await expect(page.getByTestId("report-running")).toBeVisible();
      await expect(page.getByRole("heading", { name: "Building your report" })).toBeVisible();
      await expect(page.getByText("You do not need to upload the files again.")).toBeVisible();
      await expect(page.getByText(`${fixture.sourceCount} source`, { exact: false })).toBeVisible();
      await expect(page.getByText("Files received")).toBeVisible();
      await expect(page.getByText("Validating data")).toBeVisible();
      await expect(page.getByText("Combining sources")).toBeVisible();
      await expect(page.getByText("Building business diagnosis")).toBeVisible();
      await expect(page.getByText("Preparing report and PDF")).toBeVisible();
      await expect(page.getByTestId("report-content")).toHaveCount(0);
      await expect(page.getByTestId("report-failed")).toHaveCount(0);
      await expect(page.getByText("$--", { exact: true })).toHaveCount(0);
      await expect(page.getByText("--", { exact: true })).toHaveCount(0);
      await expect(page.getByText("PDF unavailable")).toHaveCount(0);
      await expect(page.getByText("Key findings")).toHaveCount(0);
    });
  }

  test("renders a failed state without showing the running screen", async ({ page }) => {
    await page.route("**/v1/reports/rep_failed", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: "rep_failed",
          title: "Combined Report",
          status: "failed",
          created_at: "2026-03-01T10:00:00Z",
          source_count: 2,
        }),
      });
    });

    await page.goto("/app/report/rep_failed");

    await expect(page).toHaveURL("/app/report/rep_failed");
    await expect(page.getByTestId("report-failed")).toBeVisible();
    await expect(page.getByRole("heading", { name: "We couldn't finish this report" })).toBeVisible();
    await expect(page.getByTestId("report-running")).toHaveCount(0);
    await expect(page.getByTestId("report-content")).toHaveCount(0);
    await expect(page.getByText("Building your report")).toHaveCount(0);
  });
});
