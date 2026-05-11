import { defineConfig } from "@playwright/test";
import { baseURL } from "./server-config";

export default defineConfig({
  testDir: ".",
  testIgnore: ["truth-gate.spec.ts", "entitlement-lifecycle.spec.ts"],
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  globalSetup: "./global-setup.ts",
  use: {
    baseURL,
    trace: "on-first-retry",
    video: "retain-on-failure",
    screenshot: "only-on-failure",
    launchOptions: {
      args: [
        "--host-resolver-rules=MAP app.earnsigma.com 127.0.0.1,MAP www.earnsigma.com 127.0.0.1,MAP earnsigma.com 127.0.0.1",
      ],
    },
  },
});
