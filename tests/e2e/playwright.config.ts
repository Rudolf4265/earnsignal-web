import { defineConfig } from "@playwright/test";
import path from "node:path";

const port = Number.parseInt(process.env.PORT ?? "3100", 10);
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://app.earnsigma.com:${port}`;
const appWorkspaceRoot = path.resolve(__dirname, "../..");
const webServerUrl = process.env.PLAYWRIGHT_WEB_SERVER_URL ?? `http://127.0.0.1:${port}/api/debug/env`;

export default defineConfig({
  testDir: ".",
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
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
  webServer: {
    command: `npm run dev -- --port ${port}`,
    cwd: appWorkspaceRoot,
    url: webServerUrl,
    timeout: 120_000,
    reuseExistingServer: !process.env.CI,
  },
});
