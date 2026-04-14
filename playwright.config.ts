import fs from "node:fs";
import path from "node:path";

function loadDotEnvLocal() {
  const envPath = path.resolve(__dirname, ".env.local");
  if (!fs.existsSync(envPath)) {
    return;
  }

  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
      continue;
    }

    const [key, ...rest] = trimmed.split("=");
    const value = rest.join("=").trim().replace(/^['"]|['"]$/g, "");
    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

loadDotEnvLocal();

const baseURL = process.env.E2E_BASE_URL?.trim();

const config = {
  testDir: "./tests/e2e",
  timeout: 90_000,
  expect: {
    timeout: 10_000,
  },
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [["html", { open: "never" }], ["list"]],
  outputDir: "test-results/truth-gate-phase1",
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    navigationTimeout: 60_000,
    actionTimeout: 30_000,
  },
  projects: [
    {
      name: "setup",
      testMatch: /global\.setup\.ts/,
      use: {},
    },
    {
      name: "free-user",
      dependencies: ["setup"],
      testMatch: /specs\/.*\.spec\.ts/,
      use: {
        storageState: "tests/e2e/.auth/free.json",
      },
    },
    {
      name: "report-user",
      dependencies: ["setup"],
      testMatch: /specs\/.*\.spec\.ts/,
      use: {
        storageState: "tests/e2e/.auth/report.json",
      },
    },
    {
      name: "pro-user",
      dependencies: ["setup"],
      testMatch: /specs\/.*\.spec\.ts/,
      use: {
        storageState: "tests/e2e/.auth/pro.json",
      },
    },
  ],
};

export default config;
