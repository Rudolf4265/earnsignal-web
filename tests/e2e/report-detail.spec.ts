import { expect, test } from "@playwright/test";
import { stubAuthenticatedSession, stubEntitlements, stubUnhandledApiRoutes } from "./test-helpers";

test.describe("Report detail route", () => {
  test.beforeEach(async ({ page }) => {
    await stubAuthenticatedSession(page);
    await stubUnhandledApiRoutes(page);
    await stubEntitlements(page, "entitled");
  });

  test("loads report detail from GET /v1/reports/:reportId", async ({ page }) => {
    await page.route("**/v1/reports/r1", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          report_id: "r1",
          title: "Q1 Revenue Quality",
          status: "ready",
          summary: "Healthy growth with stable churn.",
          created_at: "2026-03-01T10:00:00Z",
          artifact_url: "https://cdn.example.test/reports/r1.pdf",
          artifact_kind: "pdf",
        }),
      });
    });

    await page.goto("/app/report/r1");

    await expect(page.getByTestId("report-content")).toBeVisible();
    await expect(page.getByText("Q1 Revenue Quality")).toBeVisible();
    await expect(page.getByText("ready")).toBeVisible();
    await expect(page.getByText("2026-03-01T10:00:00Z")).toBeVisible();
    await expect(page.getByRole("link", { name: "Download/Open PDF" })).toHaveAttribute("href", "https://cdn.example.test/reports/r1.pdf");
    await expect(page.getByText("Report not found")).toHaveCount(0);
  });

  test("renders not found state on 404", async ({ page }) => {
    await page.route("**/v1/reports/r404", async (route) => {
      await route.fulfill({
        status: 404,
        contentType: "application/json",
        body: JSON.stringify({ message: "Report not found", code: "NOT_FOUND" }),
      });
    });

    await page.goto("/app/report/r404");

    await expect(page.getByTestId("report-not-found")).toBeVisible();
    await expect(page.getByRole("link", { name: "Back to Reports" })).toBeVisible();
  });

  test("renders not entitled callout on 403", async ({ page }) => {
    await page.route("**/v1/reports/rep_forbidden", async (route) => {
      await route.fulfill({
        status: 403,
        contentType: "application/json",
        body: JSON.stringify({ message: "Forbidden", code: "FORBIDDEN" }),
      });
    });

    await page.goto("/app/report/rep_forbidden");

    await expect(page.getByTestId("gate-not-entitled")).toBeVisible();
    await expect(page.getByRole("link", { name: "Go to Billing" })).toBeVisible();
  });
});
