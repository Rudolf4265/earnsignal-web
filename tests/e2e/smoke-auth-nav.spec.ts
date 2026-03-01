import { expect, test } from "@playwright/test";
import {
  assertNoGateLoading,
  stubAuthenticatedSession,
  stubEntitlements,
  stubEntitlementsSessionExpired,
  stubUnauthenticatedSession,
  stubUnhandledApiRoutes,
} from "./test-helpers";

test.describe("Auth + Nav + Gate smoke", () => {
  test("anonymous access redirects to login with returnTo", async ({ page }) => {
    await stubUnhandledApiRoutes(page);
    await stubUnauthenticatedSession(page);

    await page.goto("/app");

    await expect(page).toHaveURL(/\/login\?returnTo=%2Fapp/);
  });

  test("authenticated entitled user lands on dashboard without redirect loop", async ({ page }) => {
    await stubAuthenticatedSession(page);
    await stubUnhandledApiRoutes(page);
    await stubEntitlements(page, "entitled");

    await page.goto("/app");

    await expect(page.getByTestId("nav-dashboard")).toBeVisible();
    await expect(page).toHaveURL("/app");
    await assertNoGateLoading(page);
  });

  test("nav canonicalization routes to /app/data", async ({ page }) => {
    await stubAuthenticatedSession(page);
    await stubUnhandledApiRoutes(page);
    await stubEntitlements(page, "entitled");

    await page.goto("/app");
    await page.getByTestId("nav-data").click();
    await expect(page).toHaveURL("/app/data");

    await page.goto("/app/upload");
    await expect(page).toHaveURL("/app/data");
  });

  test("report sub-routes keep reports nav active", async ({ page }) => {
    await stubAuthenticatedSession(page);
    await stubUnhandledApiRoutes(page);
    await stubEntitlements(page, "entitled");

    await page.goto("/app/report/rep_123");

    await expect(page.getByTestId("nav-reports")).toHaveAttribute("aria-current", "page");
  });

  test("gate states: unentitled + session expired", async ({ page }) => {
    await stubAuthenticatedSession(page);
    await stubUnhandledApiRoutes(page);
    await stubEntitlements(page, "unentitled");

    await page.goto("/app/report");

    const redirectedToBilling = /\/app\/billing/.test(page.url());
    const notEntitledVisible = await page.getByTestId("gate-not-entitled").isVisible().catch(() => false);
    expect(redirectedToBilling || notEntitledVisible).toBeTruthy();

    await page.unroute("**/v1/entitlements");
    await stubEntitlementsSessionExpired(page);
    await page.goto("/app");

    await expect(page.getByTestId("gate-session-expired")).toBeVisible();
  });
});
