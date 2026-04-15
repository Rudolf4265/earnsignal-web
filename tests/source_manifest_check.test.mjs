/**
 * Tests for scripts/generate-source-manifest-static.mjs --check mode.
 *
 * Validates:
 * - Script exits 0 and emits a [WARN] when creator_optimizer is absent (CI-safe skip)
 * - Script source contains the stale-detection exit-1 path
 * - Script source embeds a commit SHA comment when generating
 * - Script source contains the [WARN] text for skip visibility
 */

import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";

const SCRIPT = path.resolve("scripts/generate-source-manifest-static.mjs");

// ---------------------------------------------------------------------------
// Behavioral: skip path (no Python or backend repo required)
// ---------------------------------------------------------------------------

test("--check exits 0 and warns when creator_optimizer repo is absent", () => {
  const result = spawnSync(
    process.execPath,
    [SCRIPT, "--check"],
    {
      encoding: "utf8",
      env: { ...process.env, CREATOR_OPTIMIZER_REPO: "/nonexistent/path/creator_optimizer" },
    },
  );

  assert.equal(result.status, 0, `expected exit 0 on skip, got ${result.status}. stderr: ${result.stderr}`);

  const combined = result.stdout + result.stderr;
  assert.ok(
    combined.includes("[WARN]"),
    `expected [WARN] in output on skip, got: ${combined}`,
  );
  assert.ok(
    combined.includes("skipped"),
    `expected "skipped" in output, got: ${combined}`,
  );
});

// ---------------------------------------------------------------------------
// Source inspection: key code paths must remain present
// ---------------------------------------------------------------------------

test("check script contains stale-detection exit-1 path", async () => {
  const src = await readFile(SCRIPT, "utf8");
  assert.ok(
    src.includes("is out of date. Run: npm run source-manifest:generate"),
    "stale-detection error message must be present in script",
  );
  assert.ok(
    src.includes("process.exit(1)"),
    "exit(1) must be present in script for stale-detection path",
  );
});

test("check script emits [WARN] on skip", async () => {
  const src = await readFile(SCRIPT, "utf8");
  assert.ok(
    src.includes("[WARN] source-manifest check skipped"),
    "script must emit [WARN] message when skipping",
  );
});

test("check script injects backend commit SHA into generated file", async () => {
  const src = await readFile(SCRIPT, "utf8");
  assert.ok(
    src.includes("Generated from creator_optimizer commit:"),
    "script must include commit SHA comment in generated output",
  );
  assert.ok(
    src.includes("resolveBackendCommit"),
    "resolveBackendCommit function must be present",
  );
});

test("check script uses --check flag to select mode", async () => {
  const src = await readFile(SCRIPT, "utf8");
  assert.ok(
    src.includes('process.argv.includes("--check")'),
    '--check flag detection must be present',
  );
});
