import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { readFile } from "node:fs/promises";

async function readSource(relativePath) {
  return readFile(path.resolve(relativePath), "utf8");
}

test("generated schema includes canonical entitlement fields and billing status route", async () => {
  const source = await readSource("src/lib/api/generated/schema.ts");

  assert.equal(source.includes('"/v1/billing/status": {'), true);
  assert.equal(source.includes('EntitlementsResponse: {'), true);
  assert.equal(source.includes('entitlements: components["schemas"]["EntitlementsResponse"];'), true);

  for (const field of ["effective_plan_tier", "entitlement_source", "access_granted", "access_reason_code", "billing_required"]) {
    const pattern = new RegExp(`\\b${field}\\??:`);
    assert.match(source, pattern, `expected generated schema to contain ${field}`);
  }
});

test("generated index requires entitlement and billing status schema types", async () => {
  const source = await readSource("src/lib/api/generated/index.ts");

  assert.equal(source.includes('export type EntitlementsResponseSchema = RequiredSchema<"EntitlementsResponse">;'), true);
  assert.equal(source.includes('export type BillingStatusResponseSchema = RequiredSchema<"BillingStatusResponse">;'), true);
});
