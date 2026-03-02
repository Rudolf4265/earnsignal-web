import test from "node:test";
import assert from "node:assert/strict";
import { decideFeatureGuardOutcome } from "../src/lib/gating/feature-guard-decision.mjs";

test("authed_unentitled + /app/report redirects to billing (no loading)", () => {
  const outcome = decideFeatureGuardOutcome({ gateState: "authed_unentitled", pathname: "/app/report", feature: "report" });
  assert.deepEqual(outcome, {
    kind: "redirect",
    href: "/app/billing?reason=upgrade_required&from=%2Fapp%2Freport",
  });
  assert.notEqual(outcome.kind, "render_loading");
});

test("authed_unentitled + /app/billing renders children", () => {
  const outcome = decideFeatureGuardOutcome({ gateState: "authed_unentitled", pathname: "/app/billing", feature: "report" });
  assert.deepEqual(outcome, { kind: "render_children" });
});

test("entitlements_error + /app/report renders entitlements error", () => {
  const outcome = decideFeatureGuardOutcome({ gateState: "entitlements_error", pathname: "/app/report", feature: "report" });
  assert.deepEqual(outcome, { kind: "render_entitlements_error" });
});

test("session_expired on guarded route renders session expired", () => {
  const outcome = decideFeatureGuardOutcome({ gateState: "session_expired", pathname: "/app/report/abc", feature: "report" });
  assert.deepEqual(outcome, { kind: "render_session_expired" });
});

test("authed_loading_entitlements renders loading", () => {
  const outcome = decideFeatureGuardOutcome({ gateState: "authed_loading_entitlements", pathname: "/app/report", feature: "report" });
  assert.deepEqual(outcome, { kind: "render_loading" });
});

test("anon redirects to login with returnTo", () => {
  const outcome = decideFeatureGuardOutcome({ gateState: "anon", pathname: "/app/report/abc", feature: "report" });
  assert.deepEqual(outcome, {
    kind: "redirect",
    href: "/login?returnTo=%2Fapp%2Freport%2Fabc",
  });
});
