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

  test("renders body from production report.sections payload shape", async ({ page }) => {
    await page.route("**/v1/reports/rep_sections_prod", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: "rep_sections_prod",
          title: "Production Shape Report",
          status: "ready",
          created_at: "2026-03-09T12:00:00Z",
          artifact_json_url: "https://artifacts.test/rep_sections_prod.json",
          artifact_url: "/v1/reports/rep_sections_prod/artifact",
        }),
      });
    });

    await page.route("https://artifacts.test/rep_sections_prod.json", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          report: {
            report_id: "rep_sections_prod",
            schema_version: "v1",
            sections: {
              executive_summary: {
                summary: "Revenue quality improved while volatility eased.",
              },
              revenue_snapshot: {
                net_revenue: 215000,
                series: [
                  { period: "2025-12", net_revenue: 198000 },
                  { period: "2026-01", net_revenue: 205500 },
                  { period: "2026-02", net_revenue: 215000 },
                ],
              },
              subscribers_retention: {
                items: ["Retention stayed above target for the quarter."],
              },
              tier_health: {
                items: ["Mid-tier conversion improved month over month."],
              },
              platform_mix: {
                items: ["YouTube remains largest channel with steady diversification."],
              },
              clustered_themes: {
                items: ["Audience quality and pricing discipline are compounding."],
              },
              stability: {
                stability_index: 87,
                items: ["Churn velocity is moderating."],
              },
              prioritized_insights: {
                items: ["High-retention cohorts are driving margin expansion."],
              },
              ranked_recommendations: {
                items: ["Shift spend toward retention experiments before scaling acquisition."],
              },
              outlook: {
                summary: "Base case remains growth-positive with lower downside variance.",
              },
              plan: {
                items: ["Run annual plan sensitivity tests in Q2."],
              },
              appendix: {
                paragraphs: ["Method notes and assumptions."],
              },
            },
          },
        }),
      });
    });

    await page.goto("/app/report/rep_sections_prod");

    await expect(page.getByTestId("report-content")).toBeVisible();
    await expect(page.getByText("Executive Summary")).toBeVisible();
    await expect(page.getByText("Net Revenue")).toBeVisible();
    await expect(page.getByText("Key Signals")).toBeVisible();
    await expect(page.getByText("Recommended Actions")).toBeVisible();
    await expect(page.getByText("Outlook")).toBeVisible();
    await expect.poll(async () => page.locator("article").count()).toBeGreaterThan(0);
  });

  test("shows visible artifact contract error for malformed artifact payloads", async ({ page }) => {
    await page.route("**/v1/reports/rep_contract_error", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: "rep_contract_error",
          title: "Contract Error Report",
          status: "ready",
          created_at: "2026-03-09T12:00:00Z",
          artifact_json_url: "https://artifacts.test/rep_contract_error.json",
          artifact_url: "/v1/reports/rep_contract_error/artifact",
          summary: "Fallback report summary.",
        }),
      });
    });

    await page.route("https://artifacts.test/rep_contract_error.json", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          report: {
            schema_version: "v2",
            sections: {
              executive_summary: {
                summary: "Invalid schema payload.",
              },
            },
          },
        }),
      });
    });

    await page.goto("/app/report/rep_contract_error");

    await expect(page.getByTestId("report-content")).toBeVisible();
    await expect(page.getByText("Artifact JSON unavailable")).toBeVisible();
    await expect(page.getByText("failed schema validation")).toBeVisible();
    await expect(page.getByText("Fallback report summary.")).toBeVisible();
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

  test("renders upgrade state on canonical ENTITLEMENT_REQUIRED denial", async ({ page }) => {
    await page.route("**/v1/reports/rep_entitlement_required", async (route) => {
      await route.fulfill({
        status: 403,
        contentType: "application/json",
        body: JSON.stringify({
          status: "error",
          code: "ENTITLEMENT_REQUIRED",
          message: "Upgrade required",
          details: {
            access_reason_code: "ENTITLEMENT_REQUIRED",
            billing_required: true,
          },
        }),
      });
    });

    await page.goto("/app/report/rep_entitlement_required");

    await expect(page.getByTestId("report-entitlement-required")).toBeVisible();
    await expect(page.getByRole("link", { name: "Go to Billing" })).toBeVisible();
  });

  test("never requests /v1/reports/undefined for a valid /app/report/[id] route", async ({ page }) => {
    const reportRequests = new Set<string>();

    await page.route("**/v1/reports/**", async (route) => {
      const url = new URL(route.request().url());
      reportRequests.add(url.pathname);

      if (url.pathname.endsWith("/v1/reports/rep_guard")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            id: "rep_guard",
            title: "Guarded report",
            status: "ready",
            summary: "Regression guard",
            created_at: "2026-03-01T10:00:00Z",
          }),
        });
        return;
      }

      await route.fulfill({
        status: 404,
        contentType: "application/json",
        body: JSON.stringify({ message: "Not found", code: "NOT_FOUND" }),
      });
    });

    await page.goto("/app/report/rep_guard");

    await expect(page.getByTestId("report-content")).toBeVisible();
    expect(Array.from(reportRequests).some((path) => /\/v1\/reports\/undefined$/i.test(path))).toBeFalsy();
    expect(reportRequests.has("/v1/reports/rep_guard")).toBeTruthy();
  });
});
