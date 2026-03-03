import { expect, test } from "@playwright/test";
import { stubAuthenticatedSession, stubEntitlements } from "./test-helpers";

test.describe("Reports routes", () => {
  test.beforeEach(async ({ page }) => {
    await stubAuthenticatedSession(page);
    await stubEntitlements(page, "entitled");
  });

  test("T1 — View uses real ID", async ({ page }) => {
    const detailRequests: string[] = [];

    await page.route("**/v1/reports?**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          items: [{ report_id: "r1", status: "ready", created_at: "2026-01-01T00:00:00Z" }],
          next_offset: 1,
          has_more: false,
        }),
      });
    });

    await page.route("**/v1/reports/*", async (route) => {
      detailRequests.push(route.request().url());
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ report_id: "r1", status: "ready", title: "R1", summary: "ok" }),
      });
    });

    await page.goto("/app/report");
    await page.getByTestId("report-view-r1").click();

    await expect(page).toHaveURL(/\/app\/report\/r1$/);
    await expect.poll(() => detailRequests.length).toBeGreaterThan(0);
    expect(detailRequests.some((url) => url.endsWith("/v1/reports/r1"))).toBeTruthy();
    expect(detailRequests.some((url) => url.endsWith("/v1/reports/undefined"))).toBeFalsy();
  });

  test("T2 — Invalid link guard", async ({ page }) => {
    const detailRequests: string[] = [];

    await page.route("**/v1/reports/*", async (route) => {
      detailRequests.push(route.request().url());
      await route.fulfill({ status: 500, body: "" });
    });

    await page.goto("/app/report/undefined");

    await expect(page.getByTestId("report-invalid-link")).toBeVisible();
    expect(detailRequests.some((url) => url.endsWith("/v1/reports/undefined"))).toBeFalsy();
  });

  test("T3 — 404 envelope handling", async ({ page }) => {
    await page.route("**/v1/reports/r404", async (route) => {
      await route.fulfill({
        status: 404,
        contentType: "application/json",
        body: JSON.stringify({
          error: {
            code: "NOT_FOUND",
            message: "Report was not found.",
            request_id: "abc-123",
          },
        }),
      });
    });

    await page.goto("/app/report/r404");

    await expect(page.getByTestId("report-not-found")).toContainText("Report not found");
    await expect(page.getByText("request_id: abc-123")).toBeVisible();
  });

  test("T4 — View enable rules", async ({ page }) => {
    await page.route("**/v1/reports?**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          items: [
            { report_id: "r-ready", status: "ready", artifact_url: null, created_at: "2026-01-01T00:00:00Z" },
            { status: "ready", created_at: "2026-01-02T00:00:00Z" },
          ],
          next_offset: 2,
          has_more: false,
        }),
      });
    });

    await page.goto("/app/report");

    await expect(page.getByTestId("report-view-r-ready")).toBeEnabled();
    await expect(page.getByTestId("report-view-disabled-0")).toBeDisabled();
  });
});
