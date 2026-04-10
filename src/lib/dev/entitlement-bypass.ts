/**
 * DEV ENTITLEMENT BYPASS — server-side only.
 *
 * Import this module only from Next.js API route handlers or other server-only
 * code. Never import it from client components or shared browser modules.
 *
 * All guard checks read process.env at call-time (not module load-time) so they
 * can be exercised in unit tests without reloading the module.
 */

export type DevBypassPlan = "pro";

const SYNTHETIC_REQUEST_ID = "dev_bypass_synthetic";

/**
 * Returns true only when ALL of the following hold:
 * - NODE_ENV is not "production"
 * - DEV_ENTITLEMENT_BYPASS env var is exactly "true"
 */
export function isDevBypassEnabled(): boolean {
  if (process.env.NODE_ENV === "production") return false;
  return process.env.DEV_ENTITLEMENT_BYPASS === "true";
}

/** Returns the lowercased email list parsed from DEV_ENTITLEMENT_EMAILS. */
export function getAllowlistedEmails(): string[] {
  return (process.env.DEV_ENTITLEMENT_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/** Returns true if the given email is present in DEV_ENTITLEMENT_EMAILS. */
export function isEmailAllowlisted(email: string | null | undefined): boolean {
  if (!email) return false;
  const list = getAllowlistedEmails();
  if (list.length === 0) return false;
  return list.includes(email.trim().toLowerCase());
}

/**
 * Returns true only when:
 * - bypass is enabled (non-production + DEV_ENTITLEMENT_BYPASS=true)
 * - the authenticated email is explicitly in DEV_ENTITLEMENT_EMAILS
 */
export function shouldApplyDevBypass(email: string | null | undefined): boolean {
  return isDevBypassEnabled() && isEmailAllowlisted(email);
}

/**
 * Builds a synthetic entitlement API envelope equivalent to an active Pro
 * subscription. The shape mirrors what the real /v1/entitlements endpoint
 * returns so that all downstream normalisation logic passes through unchanged.
 */
export function buildSyntheticEntitlementEnvelope(
  plan: DevBypassPlan = "pro",
): Record<string, unknown> {
  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  return {
    status: "ok",
    code: "OK",
    message: "Entitlements loaded. [DEV BYPASS ACTIVE — not real billing state]",
    request_id: SYNTHETIC_REQUEST_ID,
    details: {
      effective_plan_tier: plan,
      entitlement_source: "admin_override",
      access_granted: true,
      access_reason_code: "ADMIN_OVERRIDE",
      billing_required: false,
      plan: plan === "pro" ? "plan_b" : "plan_a",
      plan_tier: plan,
      status: "active",
      entitled: true,
      is_active: true,
      source: "admin_override",
      can_upload: true,
      can_validate_upload: true,
      can_generate_report: true,
      can_view_reports: true,
      can_download_pdf: true,
      can_access_dashboard: true,
      can_view_report_history: true,
      can_access_dashboard_intelligence: true,
      can_access_recurring_monitoring: true,
      can_access_pro_comparisons_or_future_pro_features: true,
      can_view_wow_summary: true,
      can_view_opportunity: true,
      can_view_strengths_risks: true,
      can_view_next_actions: true,
      can_view_teaser_preview: false,
      reports_remaining_this_period: 99,
      reports_generated_this_period: 0,
      monthly_report_limit: 99,
      billing_period_start: now.toISOString(),
      billing_period_end: periodEnd.toISOString(),
      features: { app: true, upload: true, report: true },
    },
  };
}
