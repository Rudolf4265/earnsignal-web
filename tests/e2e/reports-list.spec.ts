import { expect, test } from "@playwright/test";
import { stubAuthenticatedSession, stubEntitlements, stubUnhandledApiRoutes } from "./test-helpers";

test.describe("Reports list page", () => {
  test("entitled user sees ready report row with View action", async ({ page }) => {
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
              report_id: "rep_ready_001",
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

    await page.goto("/app/report");

    await expect(page.getByTestId("reports-list")).toBeVisible();
    await expect(page.getByText("March Report")).toBeVisible();
    await expect(page.getByRole("link", { name: "View" })).toHaveAttribute("href", "/app/report/rep_ready_001");
    await expect(page.getByRole("link", { name: "Open sample report" })).toBeVisible();
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

  test("500 error shows retry and recovers on retry", async ({ page }) => {
    await stubAuthenticatedSession(page);
    await stubUnhandledApiRoutes(page);
    await stubEntitlements(page, "entitled");

    let shouldFail = true;
    await page.route("**/v1/reports?**", async (route) => {
      if (shouldFail) {
        await route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({
            status: "error",
            code: "HTTP_500",
            message: "Internal error",
            request_id: "req_reports_500",
          }),
        });
        shouldFail = false;
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          items: [
            {
              report_id: "rep_recovered",
              created_at: "2026-03-02T10:15:00Z",
              status: "ready",
              title: "Recovered Report",
              platforms: null,
              coverage_start: null,
              coverage_end: null,
              artifact_url: null,
              artifact_kind: null,
              upload_id: null,
              job_id: null,
            },
          ],
          next_offset: 1,
          has_more: false,
        }),
      });
    });

    await page.goto("/app/report");

    await expect(page.getByTestId("reports-error")).toBeVisible();
    await page.getByRole("button", { name: "Retry" }).click();

    await expect(page.getByTestId("reports-list")).toBeVisible();
    await expect(page.getByText("Recovered Report")).toBeVisible();
  });
});
