import { expect, test } from "@playwright/test";
import { stubAuthenticatedSession, stubEntitlements, stubUnhandledApiRoutes } from "./test-helpers";

test.describe("Billing flows", () => {
  test.beforeEach(async ({ page }) => {
    await stubAuthenticatedSession(page);
    await stubUnhandledApiRoutes(page);
    await page.addInitScript(() => {
      const w = window as Window & { __lastCheckoutUrl?: string };
      const originalAssign = window.location.assign.bind(window.location);
      window.location.assign = ((value: string | URL) => {
        w.__lastCheckoutUrl = String(value);
      }) as Location["assign"];
      void originalAssign;
    });
  });

  test("entitled user sees active plan", async ({ page }) => {
    await stubEntitlements(page, "entitled");

    await page.goto("/app/billing");

    await expect(page.getByTestId("billing-current-plan")).toContainText("Plan: plan_a · Status: active");
    await expect(page.getByTestId("billing-current-badge")).toBeVisible();
  });

  test("unentitled user sees subscribe CTA", async ({ page }) => {
    await stubEntitlements(page, "unentitled");

    await page.goto("/app/billing");

    await expect(page.getByRole("button", { name: "Subscribe to Plan A" })).toBeVisible();
  });

  test("checkout success redirects to stripe URL", async ({ page }) => {
    await stubEntitlements(page, "entitled");
    await page.route("**/v1/billing/checkout", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ checkout_url: "https://stripe.test/checkout" }),
      });
    });

    await page.goto("/app/billing");
    await page.getByRole("button", { name: "Subscribe to Plan A" }).click();

    await expect
      .poll(async () => page.evaluate(() => (window as Window & { __lastCheckoutUrl?: string }).__lastCheckoutUrl ?? null))
      .toBe("https://stripe.test/checkout");
  });

  test("checkout fallback from /v1/billing/checkout to /v1/checkout", async ({ page }) => {
    await stubEntitlements(page, "entitled");
    await page.route("**/v1/billing/checkout", async (route) => {
      await route.fulfill({ status: 404, contentType: "application/json", body: JSON.stringify({ message: "not found" }) });
    });
    await page.route("**/v1/checkout", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ url: "https://stripe.test/checkout-fallback" }),
      });
    });

    await page.goto("/app/billing");
    await page.getByRole("button", { name: "Subscribe to Plan A" }).click();

    await expect
      .poll(async () => page.evaluate(() => (window as Window & { __lastCheckoutUrl?: string }).__lastCheckoutUrl ?? null))
      .toBe("https://stripe.test/checkout-fallback");
  });

  test("checkout error displays message and request id", async ({ page }) => {
    await stubEntitlements(page, "entitled");
    await page.route("**/v1/billing/checkout", async (route) => {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({
          status: "error",
          code: "INTERNAL_ERROR",
          message: "Checkout unavailable",
          request_id: "req_checkout_500",
        }),
      });
    });

    await page.goto("/app/billing");
    await page.getByRole("button", { name: "Subscribe to Plan A" }).click();

    await expect(page.getByTestId("billing-error-banner")).toBeVisible();
    await expect(page.getByText("Request ID: req_checkout_500")).toBeVisible();
  });
});
