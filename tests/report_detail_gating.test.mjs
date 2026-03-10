import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { readFile } from "node:fs/promises";

const reportDetailGatingPath = path.resolve("src/lib/report/detail-gating.ts");

test("report detail gating centralizes Pro-tier resolution through canonical helper", async () => {
  const source = await readFile(reportDetailGatingPath, "utf8");

  assert.equal(source.includes('import { isProPlan } from "../dashboard/action-cards";'), true);
  assert.equal(source.includes('return entitlements.entitled && isProPlan(entitlements) ? "pro-unlocked" : "pro-locked";'), true);
});

test("report detail gating defines loading-safe handling for unresolved entitlement states", async () => {
  const source = await readFile(reportDetailGatingPath, "utf8");

  assert.equal(source.includes('gateState === "session_loading"'), true);
  assert.equal(source.includes('gateState === "authed_loading_entitlements"'), true);
  assert.equal(source.includes('gateState === "entitlements_error"'), true);
  assert.equal(source.includes("entitlements === null"), true);
  assert.equal(source.includes('return "loading-safe";'), true);
});

test("report detail gating maps all required sections and enforces non-leak guard", async () => {
  const source = await readFile(reportDetailGatingPath, "utf8");

  assert.equal(source.includes('subscriberHealth: proMode'), true);
  assert.equal(source.includes('growthRecommendations: proMode'), true);
  assert.equal(source.includes('revenueOutlook: proMode'), true);
  assert.equal(source.includes('platformRiskExplanation: proMode'), true);
  assert.equal(source.includes('return mode === "pro-unlocked";'), true);
});
