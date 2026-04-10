/**
 * Unit tests for src/lib/dev/entitlement-bypass.ts
 *
 * All guards in the bypass helper read process.env at call-time, so we can
 * set env vars before each assertion without reloading the module.
 */

import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";

const bypassModulePath = pathToFileURL(
  path.resolve("src/lib/dev/entitlement-bypass.ts"),
).href;

const {
  isDevBypassEnabled,
  isEmailAllowlisted,
  shouldApplyDevBypass,
  buildSyntheticEntitlementEnvelope,
  getAllowlistedEmails,
} = await import(bypassModulePath);

// ─── helpers ────────────────────────────────────────────────────────────────

function withEnv(vars, fn) {
  const saved = {};
  for (const [k, v] of Object.entries(vars)) {
    saved[k] = process.env[k];
    if (v === undefined) {
      delete process.env[k];
    } else {
      process.env[k] = v;
    }
  }
  try {
    return fn();
  } finally {
    for (const [k, v] of Object.entries(saved)) {
      if (v === undefined) {
        delete process.env[k];
      } else {
        process.env[k] = v;
      }
    }
  }
}

// ─── isDevBypassEnabled ──────────────────────────────────────────────────────

test("isDevBypassEnabled returns false when bypass var is unset", () => {
  withEnv({ DEV_ENTITLEMENT_BYPASS: undefined, NODE_ENV: "development" }, () => {
    assert.equal(isDevBypassEnabled(), false);
  });
});

test("isDevBypassEnabled returns false when bypass var is false", () => {
  withEnv({ DEV_ENTITLEMENT_BYPASS: "false", NODE_ENV: "development" }, () => {
    assert.equal(isDevBypassEnabled(), false);
  });
});

test("isDevBypassEnabled returns true when bypass=true and NODE_ENV is development", () => {
  withEnv({ DEV_ENTITLEMENT_BYPASS: "true", NODE_ENV: "development" }, () => {
    assert.equal(isDevBypassEnabled(), true);
  });
});

test("isDevBypassEnabled returns true when bypass=true and NODE_ENV is test", () => {
  withEnv({ DEV_ENTITLEMENT_BYPASS: "true", NODE_ENV: "test" }, () => {
    assert.equal(isDevBypassEnabled(), true);
  });
});

test("isDevBypassEnabled returns false when NODE_ENV is production even if bypass=true", () => {
  withEnv({ DEV_ENTITLEMENT_BYPASS: "true", NODE_ENV: "production" }, () => {
    assert.equal(isDevBypassEnabled(), false);
  });
});

// ─── isEmailAllowlisted ──────────────────────────────────────────────────────

test("isEmailAllowlisted returns false when list is empty", () => {
  withEnv({ DEV_ENTITLEMENT_EMAILS: "" }, () => {
    assert.equal(isEmailAllowlisted("dev@example.com"), false);
  });
});

test("isEmailAllowlisted returns false when list is unset", () => {
  withEnv({ DEV_ENTITLEMENT_EMAILS: undefined }, () => {
    assert.equal(isEmailAllowlisted("dev@example.com"), false);
  });
});

test("isEmailAllowlisted returns true for exact match", () => {
  withEnv({ DEV_ENTITLEMENT_EMAILS: "dev@example.com" }, () => {
    assert.equal(isEmailAllowlisted("dev@example.com"), true);
  });
});

test("isEmailAllowlisted is case-insensitive", () => {
  withEnv({ DEV_ENTITLEMENT_EMAILS: "Dev@Example.com" }, () => {
    assert.equal(isEmailAllowlisted("dev@example.com"), true);
    assert.equal(isEmailAllowlisted("DEV@EXAMPLE.COM"), true);
  });
});

test("isEmailAllowlisted handles comma-separated list", () => {
  withEnv({ DEV_ENTITLEMENT_EMAILS: "alice@example.com, bob@example.com , carol@example.com" }, () => {
    assert.equal(isEmailAllowlisted("alice@example.com"), true);
    assert.equal(isEmailAllowlisted("bob@example.com"), true);
    assert.equal(isEmailAllowlisted("carol@example.com"), true);
    assert.equal(isEmailAllowlisted("dave@example.com"), false);
  });
});

test("isEmailAllowlisted returns false for null or empty email", () => {
  withEnv({ DEV_ENTITLEMENT_EMAILS: "dev@example.com" }, () => {
    assert.equal(isEmailAllowlisted(null), false);
    assert.equal(isEmailAllowlisted(undefined), false);
    assert.equal(isEmailAllowlisted(""), false);
  });
});

// ─── shouldApplyDevBypass ────────────────────────────────────────────────────

test("shouldApplyDevBypass returns false when bypass is disabled", () => {
  withEnv({
    DEV_ENTITLEMENT_BYPASS: undefined,
    DEV_ENTITLEMENT_EMAILS: "dev@example.com",
    NODE_ENV: "development",
  }, () => {
    assert.equal(shouldApplyDevBypass("dev@example.com"), false);
  });
});

test("shouldApplyDevBypass returns false when email is not allowlisted", () => {
  withEnv({
    DEV_ENTITLEMENT_BYPASS: "true",
    DEV_ENTITLEMENT_EMAILS: "dev@example.com",
    NODE_ENV: "development",
  }, () => {
    assert.equal(shouldApplyDevBypass("other@example.com"), false);
  });
});

test("shouldApplyDevBypass returns true when bypass enabled and email allowlisted", () => {
  withEnv({
    DEV_ENTITLEMENT_BYPASS: "true",
    DEV_ENTITLEMENT_EMAILS: "dev@example.com",
    NODE_ENV: "development",
  }, () => {
    assert.equal(shouldApplyDevBypass("dev@example.com"), true);
  });
});

test("shouldApplyDevBypass returns false in production even when both vars are set", () => {
  withEnv({
    DEV_ENTITLEMENT_BYPASS: "true",
    DEV_ENTITLEMENT_EMAILS: "dev@example.com",
    NODE_ENV: "production",
  }, () => {
    assert.equal(shouldApplyDevBypass("dev@example.com"), false);
  });
});

// ─── buildSyntheticEntitlementEnvelope ──────────────────────────────────────

test("buildSyntheticEntitlementEnvelope returns a valid Pro envelope", () => {
  const envelope = buildSyntheticEntitlementEnvelope("pro");

  assert.equal(envelope.status, "ok");
  assert.equal(envelope.code, "OK");
  assert.ok(typeof envelope.request_id === "string");

  const d = envelope.details;
  assert.equal(d.effective_plan_tier, "pro");
  assert.equal(d.plan_tier, "pro");
  assert.equal(d.plan, "plan_b");
  assert.equal(d.access_granted, true);
  assert.equal(d.billing_required, false);
  assert.equal(d.entitled, true);
  assert.equal(d.is_active, true);
  assert.equal(d.status, "active");
  assert.equal(d.can_upload, true);
  assert.equal(d.can_generate_report, true);
  assert.equal(d.can_access_dashboard, true);
  assert.equal(d.can_access_dashboard_intelligence, true);
  assert.equal(d.can_access_recurring_monitoring, true);
  assert.equal(d.can_access_pro_comparisons_or_future_pro_features, true);
  assert.equal(d.can_view_wow_summary, true);
  assert.equal(d.can_view_opportunity, true);
  assert.equal(d.can_view_strengths_risks, true);
  assert.equal(d.can_view_next_actions, true);
  assert.equal(d.can_download_pdf, true);
  assert.equal(d.can_view_teaser_preview, false);
  assert.ok(typeof d.billing_period_start === "string");
  assert.ok(typeof d.billing_period_end === "string");
});

test("buildSyntheticEntitlementEnvelope defaults to pro when no plan argument given", () => {
  const envelope = buildSyntheticEntitlementEnvelope();
  assert.equal(envelope.details.effective_plan_tier, "pro");
});

test("buildSyntheticEntitlementEnvelope sets entitlement_source to admin_override", () => {
  const envelope = buildSyntheticEntitlementEnvelope("pro");
  assert.equal(envelope.details.entitlement_source, "admin_override");
  assert.equal(envelope.details.access_reason_code, "ADMIN_OVERRIDE");
});
