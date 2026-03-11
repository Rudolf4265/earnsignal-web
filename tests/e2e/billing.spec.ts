import { expect, test } from "@playwright/test";
import { stubAuthenticatedSession, stubEntitlements, stubUnhandledApiRoutes } from "./test-helpers";

async function stubBillingStatus(page, overrides: Record<string, unknown> = {}) {
  await page.route("**/v1/billing/status", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        creator_id: "creator-billing-e2e",
        checkout_configured: true,
        webhook_configured: true,
        stripe_customer_id: "cus_billing_e2e",
        stripe_subscription_id: "sub_billing_e2e",
        cancel_at_period_end: false,
        current_period_start: "2026-03-01T00:00:00Z",
        current_period_end: "2026-04-01T00:00:00Z",
        latest_processed_event_id: "evt_billing_e2e",
        effective_plan_tier: "basic",
        entitlement_source: "stripe",
        access_granted: true,
        access_reason_code: "ACTIVE_SUBSCRIPTION",
        billing_required: false,
        plan_tier: "basic",
        status: "active",
        source: "stripe",
        is_active: true,
        can_upload: true,
        can_generate_report: true,
        can_view_reports: true,
        can_download_pdf: false,
        can_access_dashboard: true,
        reports_remaining_this_period: 4,
        reports_generated_this_period: 1,
        monthly_report_limit: 5,
        ...overrides,
      }),
    });
  });
}

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

  test("entitled user sees active canonical plan", async ({ page }) => {
    await stubEntitlements(page, "entitled");
    await stubBillingStatus(page);

    await page.goto("/app/billing");

    await expect(page.getByTestId("billing-current-plan")).toContainText("Plan: Basic - Status: active");
    await expect(page.getByTestId("billing-current-badge")).toBeVisible();
  });

  test("unentitled user sees upgrade CTA", async ({ page }) => {
    await stubEntitlements(page, "unentitled");
    await stubBillingStatus(page, { plan_tier: "none", status: "inactive", is_active: false });

    await page.goto("/app/billing");

    await expect(page.getByRole("button", { name: "Choose Basic" })).toBeVisible();
  });

  test("checkout success redirects to stripe URL via canonical endpoint", async ({ page }) => {
    await stubEntitlements(page, "entitled");
    await stubBillingStatus(page);
    await page.route("**/v1/billing/create-checkout-session", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ checkout_url: "https://stripe.test/checkout" }),
      });
    });

    await page.goto("/app/billing");
    await page.getByRole("button", { name: "Choose Pro" }).click();

    await expect.poll(async () => page.evaluate(() => (window as Window & { __lastCheckoutUrl?: string }).__lastCheckoutUrl ?? null)).toBe(
      "https://stripe.test/checkout",
    );
  });

  test("checkout falls back to legacy billing endpoint when canonical endpoint is unavailable", async ({ page }) => {
    await stubEntitlements(page, "entitled");
    await stubBillingStatus(page);
    await page.route("**/v1/billing/create-checkout-session", async (route) => {
      await route.fulfill({ status: 404, contentType: "application/json", body: JSON.stringify({ message: "not found" }) });
    });
    await page.route("**/v1/billing/checkout", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ url: "https://stripe.test/checkout-fallback" }),
      });
    });

    await page.goto("/app/billing");
    await page.getByRole("button", { name: "Choose Pro" }).click();

    await expect.poll(async () => page.evaluate(() => (window as Window & { __lastCheckoutUrl?: string }).__lastCheckoutUrl ?? null)).toBe(
      "https://stripe.test/checkout-fallback",
    );
  });

  test("checkout error displays safe message and request id", async ({ page }) => {
    await stubEntitlements(page, "entitled");
    await stubBillingStatus(page);
    await page.route("**/v1/billing/create-checkout-session", async (route) => {
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
    await page.getByRole("button", { name: "Choose Pro" }).click();

    await expect(page.getByTestId("billing-error-banner")).toBeVisible();
    await expect(page.getByText("Request ID: req_checkout_500")).toBeVisible();
  });

  test("config error banner appears only when backend reports checkout not configured", async ({ page }) => {
    await stubEntitlements(page, "unentitled");
    await stubBillingStatus(page, { checkout_configured: false, plan_tier: "none", status: "inactive", is_active: false });

    await page.goto("/app/billing");
    await expect(page.getByTestId("billing-current-plan")).toBeVisible();

    await expect(page.getByTestId("billing-config-error-banner")).toBeVisible();
    await expect(page.getByRole("button", { name: "Choose Pro" })).toBeDisabled();
    await expect(page.getByTestId("billing-error-banner")).toHaveCount(0);
  });

  test("checkout config banner does not appear when backend says checkout is configured", async ({ page }) => {
    await stubEntitlements(page, "unentitled");
    await stubBillingStatus(page, { checkout_configured: true, plan_tier: "none", status: "inactive", is_active: false });
    await page.route("**/v1/billing/create-checkout-session", async (route) => {
      await route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({
          error: {
            code: "BILLING_NOT_CONFIGURED",
            message: "Stripe checkout is not configured.",
            details: { missing: ["STRIPE_PRICE_ID"] },
            request_id: "req_cfg_false_positive",
          },
        }),
      });
    });

    await page.goto("/app/billing");
    await expect(page.getByTestId("billing-current-plan")).toBeVisible();
    await page.getByRole("button", { name: "Choose Pro" }).click();

    await expect(page.getByTestId("billing-error-banner")).toBeVisible();
    await expect(page.getByText("Request ID: req_cfg_false_positive")).toBeVisible();
    await expect(page.getByTestId("billing-config-error-banner")).toHaveCount(0);
  });

  test("success return refreshes entitlements and redirects only after active state is confirmed", async ({ page }) => {
    let entitlementsCalls = 0;
    await page.route("**/v1/entitlements", async (route) => {
      entitlementsCalls += 1;
      const payload =
        entitlementsCalls < 2
          ? {
              effective_plan_tier: "none",
              entitlement_source: "none",
              access_granted: false,
              access_reason_code: "ENTITLEMENT_REQUIRED",
              billing_required: true,
              plan_tier: "none",
              status: "inactive",
              is_active: false,
              can_upload: true,
              can_generate_report: false,
              can_view_reports: true,
              can_download_pdf: false,
              can_access_dashboard: true,
            }
          : {
              effective_plan_tier: "pro",
              entitlement_source: "stripe",
              access_granted: true,
              access_reason_code: "ACTIVE_SUBSCRIPTION",
              billing_required: false,
              plan_tier: "pro",
              status: "active",
              is_active: true,
              can_upload: true,
              can_generate_report: true,
              can_view_reports: true,
              can_download_pdf: true,
              can_access_dashboard: true,
            };
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(payload) });
    });

    await stubBillingStatus(page, { plan_tier: "pro", status: "active", is_active: true, can_download_pdf: true });

    await page.goto("/app/billing/success");

    await expect(page).toHaveURL("/app");
    await expect(page.getByTestId("nav-dashboard")).toBeVisible();
  });

  test("cancel return shows non-destructive state", async ({ page }) => {
    let entitlementsCalls = 0;
    await page.unroute("**/v1/entitlements");
    await page.route("**/v1/entitlements", async (route) => {
      entitlementsCalls += 1;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          effective_plan_tier: "none",
          entitlement_source: "none",
          access_granted: false,
          access_reason_code: "ENTITLEMENT_REQUIRED",
          billing_required: true,
          plan_tier: "none",
          status: "inactive",
          is_active: false,
          can_upload: true,
          can_generate_report: false,
          can_view_reports: true,
          can_download_pdf: false,
          can_access_dashboard: true,
        }),
      });
    });
    await stubBillingStatus(page, { plan_tier: "none", status: "inactive", is_active: false });

    await page.goto("/app/billing/cancel");

    await expect(page.getByText("Checkout canceled")).toBeVisible();
    await expect(page.getByRole("link", { name: "Back to billing" })).toBeVisible();
    await expect.poll(() => entitlementsCalls).toBeGreaterThan(0);
  });
});
