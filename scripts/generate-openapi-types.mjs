#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";

const pin = process.env.OPENAPI_TYPESCRIPT_VERSION ?? "7.10.1";
const outputPath = resolve(process.cwd(), process.env.OPENAPI_TYPES_OUT ?? "src/lib/api/generated/schema.ts");
const checkOnly = process.argv.includes("--check");

function resolveSpecUrl() {
  const explicit = process.env.OPENAPI_SCHEMA_URL?.trim();
  return explicit && explicit.length > 0 ? explicit : null;
}

function generateTo(targetPath, specUrl) {
  mkdirSync(dirname(targetPath), { recursive: true });

  const command = "npx";
  const result = spawnSync(
    command,
    ["--yes", `openapi-typescript@${pin}`, specUrl, "--alphabetize", "--output", targetPath],
    {
      stdio: "inherit",
      shell: process.platform === "win32",
    },
  );

  if (result.error) {
    console.error(`[api:generate] failed to start ${command}: ${result.error.message}`);
    process.exit(1);
  }

  if (result.status !== 0) {
    console.error(`[api:generate] openapi-typescript failed for ${specUrl}`);
    process.exit(result.status ?? 1);
  }
}

const specUrl = resolveSpecUrl();
if (!specUrl) {
  if (checkOnly) {
    console.log("[api:generate:check] skipped: OPENAPI_SCHEMA_URL is not set.");
    process.exit(0);
  }

  console.error("[api:generate] OPENAPI_SCHEMA_URL is required. Example: OPENAPI_SCHEMA_URL=https://api.earnsigma.com/openapi.json");
  process.exit(1);
}

if (!checkOnly) {
  generateTo(outputPath, specUrl);
  console.log(`[api:generate] wrote ${outputPath}`);
  process.exit(0);
}

const tmpRoot = mkdtempSync(resolve(tmpdir(), "earnsignal-openapi-"));
const tmpOut = resolve(tmpRoot, "schema.ts");

try {
  generateTo(tmpOut, specUrl);
  const nextContent = readFileSync(tmpOut, "utf8").replace(/\r\n/g, "\n");
  const existingContent = readFileSync(outputPath, "utf8").replace(/\r\n/g, "\n");

  if (nextContent !== existingContent) {
    console.error(`[api:generate:check] ${outputPath} is out of date. Run: npm run api:generate`);
    process.exit(1);
  }

  console.log(`[api:generate:check] ${outputPath} is up to date.`);
} finally {
  rmSync(tmpRoot, { recursive: true, force: true });
}
