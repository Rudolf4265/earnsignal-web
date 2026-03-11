import { defineConfig } from "@playwright/test";

const baseURL = process.env.E2E_BASE_URL?.trim();

if (!baseURL) {
  throw new Error("Missing E2E_BASE_URL. Set E2E_BASE_URL to run entitlement lifecycle Playwright tests.");
}

export default defineConfig({
  testDir: ".",
  testMatch: ["entitlement-lifecycle.spec.ts"],
  fullyParallel: false,
  workers: 1,
  timeout: 12 * 60 * 1000,
  expect: {
    timeout: 45_000,
  },
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["line"], ["html", { open: "never" }]] : [["list"]],
  outputDir: "test-results/entitlement-lifecycle",
  use: {
    baseURL,
    trace: "on-first-retry",
    video: "retain-on-failure",
    screenshot: "only-on-failure",
    navigationTimeout: 90_000,
    actionTimeout: 45_000,
  },
});
