import { expect, test } from "@playwright/test";
import { stubAuthenticatedSession, stubEntitlements } from "./test-helpers";

test.describe("Reports smoke", () => {
  test("report list uses canonical report_id for view route and allows PDF download", async ({ page }) => {
    await stubAuthenticatedSession(page);
    await stubEntitlements(page, "entitled");

    let wrongDetailHits = 0;
    let artifactPdfHits = 0;

    await page.route("**/v1/reports", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          items: [
            {
              id: "artifact_uuid_only_001",
              status: "ready",
              title: "Legacy Artifact Row",
              created_at: "2026-03-01T09:00:00Z",
              artifact_url: "/v1/reports/artifact_uuid_only_001/artifact",
            },
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

    await page.route("**/v1/reports/artifact_uuid_only_001", async (route) => {
      wrongDetailHits += 1;
      await route.fulfill({
        status: 404,
        contentType: "application/json",
        body: JSON.stringify({ message: "Report not found", code: "NOT_FOUND" }),
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

    await page.route("**/v1/reports/rep_smoke_001/artifact", async (route) => {
      artifactPdfHits += 1;
      await route.fulfill({
        status: 200,
        contentType: "application/pdf",
        headers: {
          "content-disposition": 'attachment; filename="smoke-report.pdf"',
        },
        body: "%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\ntrailer\n<<>>\n%%EOF",
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

    const legacyRow = page.locator('[data-testid="report-list"] > div').filter({ hasText: "Legacy Artifact Row" }).first();
    await expect(legacyRow.getByText("Unavailable")).toBeVisible();
    await expect(legacyRow.getByRole("link", { name: "View" })).toHaveCount(0);

    await page.getByRole("link", { name: "View" }).first().click();
    await expect(page).toHaveURL("/app/report/rep_smoke_001");
    await expect(page.getByTestId("report-not-found")).toHaveCount(0);

    const kpiVisible = await page.getByText("Net Revenue").isVisible().catch(() => false);
    const executiveSummaryVisible = await page.getByText("Executive Summary").isVisible().catch(() => false);
    expect(kpiVisible || executiveSummaryVisible).toBeTruthy();

    await page.getByRole("button", { name: "Download PDF" }).click();
    await expect.poll(() => artifactPdfHits).toBeGreaterThan(0);
    expect(wrongDetailHits).toBe(0);
  });
});
