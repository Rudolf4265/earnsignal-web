import { expect, test } from "@playwright/test";
import { stubAuthenticatedSession, stubEntitlements, stubUnhandledApiRoutes } from "./test-helpers";

async function wait(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

test.describe("Route-transition stability", () => {
  test("dashboard keeps latest hydrated model across /app -> /app/data -> /app during background revalidation", async ({ page }) => {
    await stubAuthenticatedSession(page);
    await stubUnhandledApiRoutes(page);
    await stubEntitlements(page, "entitled");

    const summaryText = "Persistent summary from latest completed report.";
    let listCalls = 0;
    let detailCalls = 0;
    let latestUploadCalls = 0;

    await page.route("**/v1/uploads/latest/status", async (route) => {
      latestUploadCalls += 1;
      if (latestUploadCalls > 1) {
        await wait(1_200);
      }

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          upload_id: "upl_dash_transition",
          status: "ready",
          report_id: "rep_dash_transition",
        }),
      });
    });

    await page.route("**/v1/reports", async (route) => {
      listCalls += 1;
      if (listCalls > 1) {
        await wait(1_200);
      }

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          items: [
            {
              report_id: "rep_dash_transition",
              status: "ready",
              created_at: "2026-03-08T10:00:00Z",
              artifact_url: "/v1/reports/rep_dash_transition/artifact",
            },
          ],
          has_more: false,
          next_offset: null,
        }),
      });
    });

    await page.route("**/v1/reports/rep_dash_transition", async (route) => {
      detailCalls += 1;
      if (detailCalls > 1) {
        await wait(1_200);
      }

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: "rep_dash_transition",
          title: "Transition stability report",
          status: "ready",
          summary: summaryText,
          created_at: "2026-03-08T10:00:00Z",
        }),
      });
    });

    await page.goto("/app");
    await expect(page.getByText(summaryText)).toBeVisible();

    await page.getByTestId("nav-data").click();
    await expect(page).toHaveURL("/app/data");

    await page.getByTestId("nav-dashboard").click();
    await expect(page).toHaveURL("/app");
    await expect(page.getByText(summaryText)).toBeVisible({ timeout: 500 });
  });

  test("in-flight entitlements refresh does not re-show full workspace loading shell during internal navigation", async ({ page }) => {
    await stubAuthenticatedSession(page);
    await stubUnhandledApiRoutes(page);

    let entitlementsCalls = 0;
    await page.route("**/v1/entitlements", async (route) => {
      entitlementsCalls += 1;
      if (entitlementsCalls === 2) {
        await wait(1_500);
      }

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          plan: "starter",
          plan_tier: "starter",
          status: "inactive",
          entitled: false,
          is_active: false,
          features: { app: true, upload: true, report: false },
        }),
      });
    });

    await page.goto("/app");
    await expect(page.getByTestId("nav-dashboard")).toBeVisible();
    await expect(page.getByTestId("gate-loading")).toHaveCount(0);

    await page.goto("/app/billing/success");
    await expect(page.getByText("Checkout complete")).toBeVisible();

    await page.getByTestId("nav-data").click();
    await expect(page).toHaveURL("/app/data");
    await expect(page.getByTestId("gate-loading")).toHaveCount(0);

    await page.waitForTimeout(1_600);
    await expect(page.getByTestId("gate-loading")).toHaveCount(0);
  });
});
