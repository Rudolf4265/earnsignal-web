import { expect, test } from "@playwright/test";
import { assertNoGateLoading, stubAuthenticatedSession, stubEntitlements, stubUnhandledApiRoutes } from "./test-helpers";

test.describe("Feature guard unentitled regression", () => {
  test("unentitled report access routes to billing without loading dead-end", async ({ page }) => {
    await stubAuthenticatedSession(page);
    await stubUnhandledApiRoutes(page);
    await stubEntitlements(page, "unentitled");

    await page.goto("/app/report");

    await expect(page).toHaveURL(/\/app\/billing\?reason=upgrade_required&from=%2Fapp%2Freport/);
    await assertNoGateLoading(page);
    await expect(page.getByRole("heading", { name: "Billing" })).toBeVisible();
  });
});
