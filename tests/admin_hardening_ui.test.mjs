import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { readFile } from "node:fs/promises";

const adminGuardUrl = pathToFileURL(path.resolve("src/lib/gating/admin-guard.ts")).href;

test("admin guard defaults to loading when status is unknown", async () => {
  const { deriveAdminRenderState } = await import(`${adminGuardUrl}?t=${Date.now()}-unknown`);
  const state = deriveAdminRenderState({ isGateLoading: false, adminStatus: "unknown" });

  assert.equal(state, "loading");
});

test("admin guard resolves not authorized and authorized states deterministically", async () => {
  const { deriveAdminRenderState } = await import(`${adminGuardUrl}?t=${Date.now()}-resolved`);

  assert.equal(deriveAdminRenderState({ isGateLoading: false, adminStatus: "not_admin" }), "not_authorized");
  assert.equal(deriveAdminRenderState({ isGateLoading: false, adminStatus: "admin" }), "authorized");
});

test("admin pages include hardened loading and not-authorized test markers", async () => {
  const listSource = await readFile("app/(app)/app/admin/page.tsx", "utf8");
  const detailSource = await readFile("app/(app)/app/admin/users/[creatorId]/page.tsx", "utf8");

  for (const source of [listSource, detailSource]) {
    assert.equal(source.includes('data-testid="admin-loading"'), true);
    assert.equal(source.includes('testId="admin-not-authorized"'), true);
  }

  assert.equal(listSource.includes("Admin console"), true);
  assert.equal(detailSource.includes("Admin user detail"), true);
  assert.equal(listSource.includes("Search by email (creator ID also works)"), true);
  assert.equal(listSource.includes("No email on record"), true);
  assert.equal(listSource.includes("Grant access by email"), true);
  assert.equal(listSource.includes("Recent users"), true);
  assert.equal(listSource.includes("Show archived users"), true);
  assert.equal(listSource.includes("No account found for that email."), true);
  assert.equal(listSource.includes("Grant access failed"), true);
  assert.equal(listSource.includes("AdminEntitlementSourceBadge"), true);
  assert.equal(listSource.includes("source={user.entitlementSource}"), true);
  assert.equal(detailSource.includes("AdminEntitlementSourceBadge"), true);
  assert.equal(detailSource.includes("source={user.entitlementSource} accessReasonCode={user.accessReasonCode}"), true);
  assert.equal(listSource.includes("Open user details"), true);
  assert.equal(listSource.includes("href={`/app/admin/users/${grantResult.creatorId}`}"), true);
  assert.equal(detailSource.includes("Email: {user.email ?? \"No email on record\"}"), true);
  assert.equal(detailSource.includes("Creator ID: {user.creatorId}"), true);
  assert.equal(detailSource.includes("Archive user"), true);
  assert.equal(detailSource.includes("Delete user"), true);
  assert.equal(detailSource.includes("Danger zone"), true);
});

test("app gate resolves admin status from canonical admin.whoami API", async () => {
  const source = await readFile("app/(app)/_components/app-gate-provider.tsx", "utf8");

  assert.equal(source.includes('import { fetchAdminWhoAmI } from "@/src/lib/api/admin";'), true);
  assert.equal(source.includes("fetchAdminWhoAmI({ forceRefresh: true })"), true);
  assert.equal(source.includes("checkIsAdmin"), false);
});
