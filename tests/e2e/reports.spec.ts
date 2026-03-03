import { expect, test } from "@playwright/test";
import { stubAuthenticatedSession, stubEntitlements } from "./test-helpers";

test.describe("Reports routes", () => {
  test.beforeEach(async ({ page }) => {
    await stubAuthenticatedSession(page);
    await stubEntitlements(page, "entitled");
  });

  test("T1 — Detail uses route param and never requests undefined", async ({ page }) => {
    const detailRequests: string[] = [];
    const reportId = "6b49bf43-99b2-4c06-ba7f-d592b466938b";

    await page.route("**/v1/reports?**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ items: [], next_offset: 0, has_more: false }),
      });
    });

    await page.route(`**/v1/reports/${reportId}`, async (route) => {
      detailRequests.push(route.request().url());
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ report_id: reportId, status: "ready", title: "R1", summary: "ok" }),
      });
    });

    await page.route("**/v1/reports/undefined", async (route) => {
      detailRequests.push(route.request().url());
      await route.fulfill({ status: 404, contentType: "application/json", body: "{}" });
    });

    await page.goto(`/app/report/${reportId}`);

    await expect(page.getByTestId("report-content")).toBeVisible();
    expect(detailRequests.some((url) => url.endsWith(`/v1/reports/${reportId}`))).toBeTruthy();
    expect(detailRequests.some((url) => url.endsWith("/v1/reports/undefined"))).toBeFalsy();
  });

  test("T2 — Invalid link does not fetch undefined", async ({ page }) => {
    const detailRequests: string[] = [];

    await page.route("**/v1/reports/*", async (route) => {
      detailRequests.push(route.request().url());
      await route.fulfill({ status: 500, body: "" });
    });

    await page.goto("/app/report/undefined");

    await expect(page.getByTestId("report-invalid-link")).toBeVisible();
    expect(detailRequests.some((url) => url.endsWith("/v1/reports/undefined"))).toBeFalsy();
  });

  test("T3 — 404 envelope shows request_id", async ({ page }) => {
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

  test("T4 — app routes do not fetch www.earnsigma.com", async ({ page }) => {
    const externalRequests: string[] = [];

    page.on("request", (request) => {
      if (request.url().startsWith("https://www.earnsigma.com/")) {
        externalRequests.push(request.url());
      }
    });

    await page.route("**/v1/reports?**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ items: [], next_offset: 0, has_more: false }),
      });
    });

    await page.route("**/v1/reports/r1", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ report_id: "r1", status: "ready", title: "R1", summary: "ok" }),
      });
    });

    await page.goto("/app/report");
    await expect(page.getByRole("link", { name: "Privacy" })).toBeVisible();

    await page.goto("/app/report/r1");
    await expect(page.getByTestId("report-content")).toBeVisible();

    expect(externalRequests).toEqual([]);
  });
});
