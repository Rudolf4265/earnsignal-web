import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";

const moduleUrl = pathToFileURL(path.resolve("src/lib/billing/gating.ts")).href;
const { decideAppGate } = await import(`${moduleUrl}?t=${Date.now()}`);

test("decideAppGate allows entitled users", () => {
  const decision = decideAppGate({
    hasSession: true,
    isLoadingSession: false,
    isLoadingEntitlements: false,
    isEntitled: true,
    pathname: "/app",
  });

  assert.equal(decision, "allow");
});

test("decideAppGate redirects non-entitled users to billing outside billing routes", () => {
  const decision = decideAppGate({
    hasSession: true,
    isLoadingSession: false,
    isLoadingEntitlements: false,
    isEntitled: false,
    pathname: "/app/report",
  });

  assert.equal(decision, "redirect_billing");
});

test("decideAppGate redirects users without session to login", () => {
  const decision = decideAppGate({
    hasSession: false,
    isLoadingSession: false,
    isLoadingEntitlements: false,
    isEntitled: false,
    pathname: "/app",
  });

  assert.equal(decision, "redirect_login");
});


test("decideAppGate allows navigation when entitlements request fails", async () => {
  const { decideAppGate } = await import(`${moduleUrl}?t=${Date.now()}-entitlements-error`);

  const decision = decideAppGate({
    hasSession: true,
    isLoadingSession: false,
    isLoadingEntitlements: false,
    hasEntitlementsError: true,
    isEntitled: false,
    pathname: "/app/report",
  });

  assert.equal(decision, "allow");
});
