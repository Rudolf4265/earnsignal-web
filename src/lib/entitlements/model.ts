export type EntitlementSnapshotLike = {
  effectivePlanTier?: string | null;
  effective_plan_tier?: string | null;
  planTier?: string | null;
  plan_tier?: string | null;
  plan?: string | null;
  entitlementSource?: string | null;
  entitlement_source?: string | null;
  source?: string | null;
  accessGranted?: boolean | null;
  access_granted?: boolean | null;
  isActive?: boolean | null;
  is_active?: boolean | null;
  entitled?: boolean | null;
  canGenerateReport?: boolean | null;
  can_generate_report?: boolean | null;
  canDownloadPdf?: boolean | null;
  can_download_pdf?: boolean | null;
  accessReasonCode?: string | null;
  access_reason_code?: string | null;
  reason_code?: string | null;
  billingRequired?: boolean | null;
  billing_required?: boolean | null;
};

const PLAN_TIER_ALIASES: Record<string, string> = {
  basic: "basic",
  plan_a: "basic",
  free: "basic",
  starter: "basic",
  founder_creator_report: "founder_creator_report",
  founder: "founder_creator_report",
  pro: "pro",
  plan_b: "pro",
  creator_pro: "pro",
  protected_paid: "protected_paid",
  protected: "protected_paid",
  none: "none",
  no_plan: "none",
  inactive: "none",
};

const PRO_EQUIVALENT_PLAN_TIERS = new Set([
  "pro",
  "creator_pro",
  "plan_b",
  "founder_creator_report",
  "founder",
  "protected_paid",
  "paid_equivalent",
]);
const OVERRIDE_SOURCES = new Set(["override", "admin_override", "manual_override", "grant", "comp"]);
const OVERRIDE_ACCESS_REASON_CODES = new Set(["OVERRIDE_ACTIVE", "ADMIN_OVERRIDE", "COMP_ACCESS"]);
const BILLING_REQUIRED_REASON_CODES = new Set(["ENTITLEMENT_REQUIRED", "BILLING_REQUIRED", "PLAN_REQUIRED", "UPGRADE_REQUIRED"]);

function asBoolean(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

function normalizeString(value: string | null | undefined): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  return trimmed;
}

export function normalizePlanTierAlias(value: string | null | undefined): string {
  const normalized = normalizeString(value)?.toLowerCase();
  if (!normalized) {
    return "none";
  }

  return PLAN_TIER_ALIASES[normalized] ?? normalized;
}

export function resolveEffectivePlanTier(entitlements: EntitlementSnapshotLike | null | undefined): string {
  if (!entitlements) {
    return "none";
  }

  return normalizePlanTierAlias(
    entitlements.effectivePlanTier ??
      entitlements.effective_plan_tier ??
      entitlements.planTier ??
      entitlements.plan_tier ??
      entitlements.plan ??
      null,
  );
}

export function resolveEntitlementSource(entitlements: EntitlementSnapshotLike | null | undefined): string | null {
  if (!entitlements) {
    return null;
  }

  const candidate = normalizeString(entitlements.entitlementSource ?? entitlements.entitlement_source ?? entitlements.source ?? null);
  return candidate ? candidate.toLowerCase() : null;
}

export function resolveAccessReasonCode(entitlements: EntitlementSnapshotLike | null | undefined): string | null {
  if (!entitlements) {
    return null;
  }

  const candidate = normalizeString(
    entitlements.accessReasonCode ?? entitlements.access_reason_code ?? entitlements.reason_code ?? null,
  );
  return candidate ? candidate.toUpperCase() : null;
}

export function resolveAccessGranted(entitlements: EntitlementSnapshotLike | null | undefined): boolean {
  if (!entitlements) {
    return false;
  }

  const explicit =
    asBoolean(entitlements.accessGranted) ??
    asBoolean(entitlements.access_granted) ??
    asBoolean(entitlements.isActive) ??
    asBoolean(entitlements.is_active) ??
    asBoolean(entitlements.entitled);

  return explicit ?? false;
}

export function resolveBillingRequired(entitlements: EntitlementSnapshotLike | null | undefined): boolean {
  if (!entitlements) {
    return false;
  }

  const explicit = asBoolean(entitlements.billingRequired) ?? asBoolean(entitlements.billing_required);
  if (typeof explicit === "boolean") {
    return explicit;
  }

  const reasonCode = resolveAccessReasonCode(entitlements);
  return reasonCode ? BILLING_REQUIRED_REASON_CODES.has(reasonCode) : false;
}

export function canGenerateReportFromEntitlement(entitlements: EntitlementSnapshotLike | null | undefined): boolean {
  if (!entitlements) {
    return false;
  }

  const explicit = asBoolean(entitlements.canGenerateReport) ?? asBoolean(entitlements.can_generate_report);
  if (typeof explicit === "boolean") {
    return explicit;
  }

  return resolveAccessGranted(entitlements);
}

export function canDownloadPdfFromEntitlement(entitlements: EntitlementSnapshotLike | null | undefined): boolean {
  if (!entitlements) {
    return false;
  }

  const explicit = asBoolean(entitlements.canDownloadPdf) ?? asBoolean(entitlements.can_download_pdf);
  if (typeof explicit === "boolean") {
    return explicit;
  }

  return canGenerateReportFromEntitlement(entitlements);
}

export function isProEquivalentPlanTier(planTier: string | null | undefined): boolean {
  const normalized = normalizePlanTierAlias(planTier);
  return PRO_EQUIVALENT_PLAN_TIERS.has(normalized);
}

export function hasProEquivalentEntitlement(entitlements: EntitlementSnapshotLike | null | undefined): boolean {
  if (!entitlements || !resolveAccessGranted(entitlements)) {
    return false;
  }

  if (canDownloadPdfFromEntitlement(entitlements)) {
    return true;
  }

  const planTier = resolveEffectivePlanTier(entitlements);
  if (isProEquivalentPlanTier(planTier)) {
    return true;
  }

  const source = resolveEntitlementSource(entitlements);
  if (source && OVERRIDE_SOURCES.has(source)) {
    return true;
  }

  const reasonCode = resolveAccessReasonCode(entitlements);
  return reasonCode ? OVERRIDE_ACCESS_REASON_CODES.has(reasonCode) : false;
}

