import { expect, test } from "@playwright/test";
import { stubAuthenticatedSession, stubEntitlements, stubUnhandledApiRoutes } from "./test-helpers";

test.describe("Reports list page", () => {
  test("ready report enables View and routes to /app/report/:report_id", async ({ page }) => {
    await stubAuthenticatedSession(page);
    await stubUnhandledApiRoutes(page);
    await stubEntitlements(page, "entitled");

    await page.route("**/v1/reports?**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          items: [
            {
              report_id: "r1",
              created_at: "2026-03-01T10:15:00Z",
              status: "ready",
              title: "March Report",
              platforms: ["tiktok"],
              coverage_start: "2026-02-01",
              coverage_end: "2026-02-28",
              artifact_url: null,
              artifact_kind: null,
              upload_id: "upl_1",
              job_id: "job_1",
            },
          ],
          next_offset: 1,
          has_more: false,
        }),
      });
    });

    await page.route("**/v1/reports/r1", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          report_id: "r1",
          title: "March Report",
          status: "ready",
          summary: "Done",
          created_at: "2026-03-01T10:15:00Z",
        }),
      });
    });

    await page.goto("/app/report");

    await expect(page.getByTestId("reports-list")).toBeVisible();
    const view = page.getByRole("link", { name: "View" });
    await expect(view).toBeEnabled();
    await expect(view).toHaveAttribute("href", "/app/report/r1");
    await view.click();
    await expect(page).toHaveURL(/\/app\/report\/r1$/);
  });

  test("entitled user with empty list sees empty state and upload CTA", async ({ page }) => {
    await stubAuthenticatedSession(page);
    await stubUnhandledApiRoutes(page);
    await stubEntitlements(page, "entitled");

    await page.route("**/v1/reports?**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          items: [],
          next_offset: 0,
          has_more: false,
        }),
      });
    });

    await page.goto("/app/report");

    await expect(page.getByTestId("reports-empty")).toBeVisible();
    await expect(page.getByText("No reports yet")).toBeVisible();
    await expect(page.getByRole("link", { name: "Go to Data Upload" })).toHaveAttribute("href", "/app/data");
    await expect(page.getByRole("link", { name: "Open sample report" })).toBeVisible();
  });

  test("403 on reports shows upgrade CTA", async ({ page }) => {
    await stubAuthenticatedSession(page);
    await stubUnhandledApiRoutes(page);
    await stubEntitlements(page, "entitled");

    await page.route("**/v1/reports?**", async (route) => {
      await route.fulfill({
        status: 403,
        contentType: "application/json",
        body: JSON.stringify({
          status: "error",
          code: "FORBIDDEN",
          message: "forbidden",
          request_id: "req_reports_forbidden",
        }),
      });
    });

    await page.goto("/app/report");

    await expect(page.getByTestId("gate-not-entitled")).toBeVisible();
    await expect(page.getByRole("link", { name: "Go to Billing" })).toHaveAttribute("href", "/app/billing");
    await expect(page.getByText("No reports yet")).toHaveCount(0);
  });
});
