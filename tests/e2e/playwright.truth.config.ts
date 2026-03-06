import { defineConfig } from "@playwright/test";

const baseURL = process.env.E2E_BASE_URL?.trim();

if (!baseURL) {
  throw new Error("Missing E2E_BASE_URL. Set E2E_BASE_URL to run the truth-gate Playwright test.");
}

export default defineConfig({
  testDir: ".",
  testMatch: ["truth-gate.spec.ts"],
  fullyParallel: false,
  workers: 1,
  timeout: 8 * 60 * 1000,
  expect: {
    timeout: 30_000,
  },
  retries: process.env.CI ? 2 : 1,
  reporter: process.env.CI ? [["line"], ["html", { open: "never" }]] : [["list"]],
  outputDir: "test-results/truth-gate",
  use: {
    baseURL,
    trace: "on-first-retry",
    video: "retain-on-failure",
    screenshot: "only-on-failure",
    navigationTimeout: 60_000,
    actionTimeout: 30_000,
  },
});
