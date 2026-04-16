/**
 * Tests for build identity (NEXT_PUBLIC_BUILD_SHA) in the frontend debug surface.
 *
 * Validates:
 * - NEXT_PUBLIC_BUILD_SHA is read from process.env and rendered on the debug env page
 * - The field is labelled NEXT_PUBLIC_BUILD_SHA (not something generic)
 * - The page does not expose secret env vars (Stripe secret key, webhook secret, DB URL, etc.)
 * - The page is gated (notFound() / NODE_ENV production check remains present)
 */

import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";

const DEBUG_ENV_PAGE = path.resolve(
  "app/(app)/app/debug/env/page.tsx"
);
const ENV_EXAMPLE = path.resolve(".env.example");

async function readSource(file) {
  return readFile(file, "utf8");
}

// ---------------------------------------------------------------------------
// NEXT_PUBLIC_BUILD_SHA is present in the debug env page
// ---------------------------------------------------------------------------

test("debug env page references NEXT_PUBLIC_BUILD_SHA", async () => {
  const source = await readSource(DEBUG_ENV_PAGE);
  assert.equal(
    source.includes("NEXT_PUBLIC_BUILD_SHA"),
    true,
    "NEXT_PUBLIC_BUILD_SHA must appear in the debug env page"
  );
});

test("debug env page reads NEXT_PUBLIC_BUILD_SHA from process.env", async () => {
  const source = await readSource(DEBUG_ENV_PAGE);
  assert.equal(
    source.includes('process.env.NEXT_PUBLIC_BUILD_SHA'),
    true,
    "debug env page must read NEXT_PUBLIC_BUILD_SHA from process.env"
  );
});

test("debug env page falls back gracefully when NEXT_PUBLIC_BUILD_SHA is missing", async () => {
  const source = await readSource(DEBUG_ENV_PAGE);
  // The pattern `?? "(missing)"` or similar must be present for the BUILD_SHA entry
  assert.equal(
    source.includes('NEXT_PUBLIC_BUILD_SHA') && source.includes('?? "(missing)"'),
    true,
    "debug env page must handle missing NEXT_PUBLIC_BUILD_SHA gracefully"
  );
});

// ---------------------------------------------------------------------------
// The page does not expose secret values
// ---------------------------------------------------------------------------

const SECRET_PATTERNS = [
  "STRIPE_SECRET",
  "STRIPE_WEBHOOK",
  "DATABASE_URL",
  "SUPABASE_SERVICE",
  "INTERNAL_HEALTH_TOKEN",
  "SENTRY_DSN",
];

test("debug env page does not expose secret env vars", async () => {
  const source = await readSource(DEBUG_ENV_PAGE);
  for (const pattern of SECRET_PATTERNS) {
    assert.equal(
      source.includes(pattern),
      false,
      `Secret env var pattern '${pattern}' must not appear in the debug env page`
    );
  }
});

// ---------------------------------------------------------------------------
// The page is still gated in production
// ---------------------------------------------------------------------------

test("debug env page gating: production guard remains intact", async () => {
  const source = await readSource(DEBUG_ENV_PAGE);
  assert.equal(
    source.includes('process.env.NODE_ENV === "production"'),
    true,
    "Production NODE_ENV guard must still be present"
  );
  assert.equal(
    source.includes('NEXT_PUBLIC_ENABLE_DEBUG !== "true"'),
    true,
    "NEXT_PUBLIC_ENABLE_DEBUG guard must still be present"
  );
  assert.equal(
    source.includes("notFound()"),
    true,
    "notFound() guard must still be present"
  );
});

// ---------------------------------------------------------------------------
// .env.example documents NEXT_PUBLIC_BUILD_SHA
// ---------------------------------------------------------------------------

test(".env.example documents NEXT_PUBLIC_BUILD_SHA", async () => {
  const source = await readSource(ENV_EXAMPLE);
  assert.equal(
    source.includes("NEXT_PUBLIC_BUILD_SHA"),
    true,
    "NEXT_PUBLIC_BUILD_SHA must be documented in .env.example"
  );
});
