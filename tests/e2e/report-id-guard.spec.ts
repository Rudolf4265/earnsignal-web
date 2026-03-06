import { expect, test } from "@playwright/test";
import { stubAuthenticatedSession, stubEntitlements, stubUnhandledApiRoutes } from "./test-helpers";

function collectReportRequestPaths(page: import("@playwright/test").Page): Set<string> {
  const paths = new Set<string>();
  page.on("request", (request) => {
    const url = request.url();
    if (!url.includes("/v1/reports")) {
      return;
    }

    try {
      const parsed = new URL(url);
      paths.add(parsed.pathname);
    } catch {
      // Ignore malformed URLs from non-http schemes.
    }
  });
  return paths;
}

test.describe("Report ID guards across app surfaces", () => {
  test("dashboard bootstrap never requests /v1/reports/undefined", async ({ page }) => {
    await stubAuthenticatedSession(page);
    await stubUnhandledApiRoutes(page);
    await stubEntitlements(page, "entitled");

    const reportPaths = collectReportRequestPaths(page);

    await page.route("**/v1/uploads/latest/status", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          status: "ready",
          upload_id: "upl_dash_001",
          report_id: "rep_dash_001",
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
              report_id: "rep_dash_001",
              status: "ready",
              created_at: "2026-03-01T10:00:00Z",
              artifact_url: "/v1/reports/rep_dash_001/artifact",
            },
          ],
          has_more: false,
          next_offset: null,
        }),
      });
    });

    await page.route("**/v1/reports/rep_dash_001", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: "rep_dash_001",
          title: "Dashboard guard report",
          status: "ready",
          summary: "Dashboard guard summary",
          created_at: "2026-03-01T10:00:00Z",
        }),
      });
    });

    await page.goto("/app");
    await expect(page.getByTestId("nav-dashboard")).toBeVisible();
    await expect(page.getByRole("link", { name: "View" }).first()).toBeVisible();
    expect(Array.from(reportPaths).some((path) => /\/v1\/reports\/undefined$/i.test(path))).toBeFalsy();
  });

  test("reports list page never requests /v1/reports/undefined", async ({ page }) => {
    await stubAuthenticatedSession(page);
    await stubUnhandledApiRoutes(page);
    await stubEntitlements(page, "entitled");

    const reportPaths = collectReportRequestPaths(page);

    await page.route("**/v1/reports", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          items: [
            {
              report_id: "undefined",
              status: "ready",
              created_at: "2026-03-01T09:00:00Z",
              artifact_url: "/v1/reports/undefined/artifact",
            },
            {
              report_id: "rep_list_guard_001",
              status: "ready",
              created_at: "2026-03-01T10:00:00Z",
              artifact_url: "/v1/reports/rep_list_guard_001/artifact",
            },
          ],
          has_more: false,
          next_offset: null,
        }),
      });
    });

    await page.route("**/v1/reports/rep_list_guard_001", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: "rep_list_guard_001",
          title: "List guard report",
          status: "ready",
          summary: "List guard summary",
          created_at: "2026-03-01T10:00:00Z",
        }),
      });
    });

    await page.goto("/app/report");

    await expect(page.getByTestId("report-list")).toBeVisible();
    await page.getByRole("link", { name: "View" }).first().click();
    await expect(page).toHaveURL("/app/report/rep_list_guard_001");
    await expect(page.getByTestId("report-content")).toBeVisible();
    expect(Array.from(reportPaths).some((path) => /\/v1\/reports\/undefined$/i.test(path))).toBeFalsy();
  });
});
