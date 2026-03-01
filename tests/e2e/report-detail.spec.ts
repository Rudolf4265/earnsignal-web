import { expect, test } from "@playwright/test";
import { stubAuthenticatedSession, stubEntitlements, stubUnhandledApiRoutes } from "./test-helpers";

test.describe("Report detail route", () => {
  test.beforeEach(async ({ page }) => {
    await stubAuthenticatedSession(page);
    await stubUnhandledApiRoutes(page);
    await stubEntitlements(page, "entitled");
  });

  test("renders report detail on success", async ({ page }) => {
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
        }),
      });
    });

    await page.goto("/app/report/rep_success");

    await expect(page.getByTestId("report-content")).toBeVisible();
    await expect(page.getByText("Q1 Revenue Quality")).toBeVisible();
    await expect(page.getByTestId("nav-reports")).toHaveAttribute("aria-current", "page");
  });

  test("renders not found state on 404", async ({ page }) => {
    await page.route("**/v1/reports/rep_missing", async (route) => {
      await route.fulfill({
        status: 404,
        contentType: "application/json",
        body: JSON.stringify({ message: "Report not found", code: "NOT_FOUND" }),
      });
    });

    await page.goto("/app/report/rep_missing");

    await expect(page.getByTestId("report-not-found")).toBeVisible();
    await expect(page.getByRole("link", { name: "Back to Reports" })).toBeVisible();
  });

  test("renders forbidden state on 403", async ({ page }) => {
    await page.route("**/v1/reports/rep_forbidden", async (route) => {
      await route.fulfill({
        status: 403,
        contentType: "application/json",
        body: JSON.stringify({ message: "Forbidden", code: "FORBIDDEN" }),
      });
    });

    await page.goto("/app/report/rep_forbidden");

    await expect(page.getByTestId("report-forbidden")).toBeVisible();
    await expect(page.getByRole("link", { name: "Back to Dashboard" })).toBeVisible();
  });
});
