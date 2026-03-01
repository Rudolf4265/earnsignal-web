import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";

const moduleUrl = pathToFileURL(path.resolve("src/lib/gating/app-gate.ts")).href;

test("deriveAppGateState handles loading to anon", async () => {
  const { deriveAppGateState } = await import(`${moduleUrl}?t=${Date.now()}-loading-anon`);

  assert.equal(
    deriveAppGateState({ isSessionKnown: false, session: null, entitlements: { status: "idle" }, isAdmin: false }),
    "session_loading",
  );

  assert.equal(
    deriveAppGateState({ isSessionKnown: true, session: null, entitlements: { status: "idle" }, isAdmin: false }),
    "anon",
  );
});

test("deriveAppGateState resolves entitled and admin states", async () => {
  const { deriveAppGateState } = await import(`${moduleUrl}?t=${Date.now()}-entitled-admin`);
  const session = { user: { id: "user_1" } };
  const entitlements = { plan: "pro", status: "active", entitled: true, features: { app: true, report: true } };

  assert.equal(
    deriveAppGateState({ isSessionKnown: true, session, entitlements: { status: "entitled", entitlements }, isAdmin: false }),
    "authed_entitled",
  );

  assert.equal(
    deriveAppGateState({ isSessionKnown: true, session, entitlements: { status: "entitled", entitlements }, isAdmin: true }),
    "authed_admin",
  );
});

test("deriveAppGateState resolves unentitled and session expired", async () => {
  const { deriveAppGateState } = await import(`${moduleUrl}?t=${Date.now()}-unentitled-expired`);
  const session = { user: { id: "user_2" } };
  const entitlements = { plan: null, status: "inactive", entitled: false, features: {} };

  assert.equal(
    deriveAppGateState({ isSessionKnown: true, session, entitlements: { status: "unentitled", entitlements }, isAdmin: false }),
    "authed_unentitled",
  );

  assert.equal(
    deriveAppGateState({ isSessionKnown: true, session, entitlements: { status: "session_expired", requestId: "req_123" }, isAdmin: false }),
    "session_expired",
  );
});

test("canAccessPathWhenUnentitled allows only policy-safe routes", async () => {
  const { canAccessPathWhenUnentitled } = await import(`${moduleUrl}?t=${Date.now()}-policy`);

  assert.equal(canAccessPathWhenUnentitled("/app/billing"), true);
  assert.equal(canAccessPathWhenUnentitled("/app/settings"), true);
  assert.equal(canAccessPathWhenUnentitled("/app/data"), true);
  assert.equal(canAccessPathWhenUnentitled("/app/report"), false);
});
