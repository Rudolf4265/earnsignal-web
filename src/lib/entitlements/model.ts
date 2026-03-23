export type CommercialTier = "free" | "report" | "pro";

export type EntitlementSnapshotLike = {
  effectivePlanTier?: string | null;
  effective_plan_tier?: string | null;
  planTier?: string | null;
  plan_tier?: string | null;
  plan?: string | null;
  isFounder?: boolean | null;
  is_founder?: boolean | null;
  entitlementSource?: string | null;
  entitlement_source?: string | null;
  source?: string | null;
  accessGranted?: boolean | null;
  access_granted?: boolean | null;
  isActive?: boolean | null;
  is_active?: boolean | null;
  entitled?: boolean | null;
  canUpload?: boolean | null;
  can_upload?: boolean | null;
  canValidateUpload?: boolean | null;
  can_validate_upload?: boolean | null;
  canGeneratePaidReport?: boolean | null;
  can_generate_paid_report?: boolean | null;
  canGenerateReport?: boolean | null;
  can_generate_report?: boolean | null;
  canViewOwnedReport?: boolean | null;
  can_view_owned_report?: boolean | null;
  canViewReports?: boolean | null;
  can_view_reports?: boolean | null;
  canDownloadOwnedReport?: boolean | null;
  can_download_owned_report?: boolean | null;
  canDownloadPdf?: boolean | null;
  can_download_pdf?: boolean | null;
  canAccessDashboardIntelligence?: boolean | null;
  can_access_dashboard_intelligence?: boolean | null;
  canAccessDashboard?: boolean | null;
  can_access_dashboard?: boolean | null;
  canViewReportHistory?: boolean | null;
  can_view_report_history?: boolean | null;
  canAccessRecurringMonitoring?: boolean | null;
  can_access_recurring_monitoring?: boolean | null;
  canAccessProComparisonsOrFutureProFeatures?: boolean | null;
  can_access_pro_comparisons_or_future_pro_features?: boolean | null;
  canViewWowSummary?: boolean | null;
  can_view_wow_summary?: boolean | null;
  canViewOpportunity?: boolean | null;
  can_view_opportunity?: boolean | null;
  canViewStrengthsRisks?: boolean | null;
  can_view_strengths_risks?: boolean | null;
  canViewNextActions?: boolean | null;
  can_view_next_actions?: boolean | null;
  canViewTeaserPreview?: boolean | null;
  can_view_teaser_preview?: boolean | null;
  accessReasonCode?: string | null;
  access_reason_code?: string | null;
  reason_code?: string | null;
  billingRequired?: boolean | null;
  billing_required?: boolean | null;
};

export type EntitlementCapabilityKey =
  | "canUpload"
  | "canValidateUpload"
  | "canGeneratePaidReport"
  | "canViewOwnedReport"
  | "canDownloadOwnedReport"
  | "canViewReportHistory"
  | "canAccessDashboardIntelligence"
  | "canAccessRecurringMonitoring"
  | "canAccessProComparisonsOrFutureProFeatures"
  | "canViewWowSummary"
  | "canViewOpportunity"
  | "canViewStrengthsRisks"
  | "canViewNextActions"
  | "canViewTeaserPreview";

type CommercialCapabilityMatrix = Record<CommercialTier, Record<EntitlementCapabilityKey, boolean>>;

const PLAN_TIER_ALIASES: Record<string, CommercialTier> = {
  free: "free",
  none: "free",
  no_plan: "free",
  inactive: "free",
  report: "report",
  basic: "report",
  starter: "report",
  plan_a: "report",
  founder_creator_report: "report",
  founder: "report",
  pro: "pro",
  plan_b: "pro",
  creator_pro: "pro",
  protected_paid: "pro",
  protected: "pro",
  paid_equivalent: "pro",
};

const COMMERCIAL_CAPABILITY_MATRIX: CommercialCapabilityMatrix = {
  free: {
    canUpload: true,
    canValidateUpload: true,
    canGeneratePaidReport: false,
    canViewOwnedReport: false,
    canDownloadOwnedReport: false,
    canViewReportHistory: false,
    canAccessDashboardIntelligence: false,
    canAccessRecurringMonitoring: false,
    canAccessProComparisonsOrFutureProFeatures: false,
    canViewWowSummary: false,
    canViewOpportunity: false,
    canViewStrengthsRisks: false,
    canViewNextActions: false,
    canViewTeaserPreview: true,
  },
  report: {
    canUpload: true,
    canValidateUpload: true,
    canGeneratePaidReport: true,
    canViewOwnedReport: true,
    canDownloadOwnedReport: true,
    canViewReportHistory: false,
    canAccessDashboardIntelligence: false,
    canAccessRecurringMonitoring: false,
    canAccessProComparisonsOrFutureProFeatures: false,
    canViewWowSummary: true,
    canViewOpportunity: true,
    canViewStrengthsRisks: true,
    canViewNextActions: true,
    canViewTeaserPreview: false,
  },
  pro: {
    canUpload: true,
    canValidateUpload: true,
    canGeneratePaidReport: true,
    canViewOwnedReport: true,
    canDownloadOwnedReport: true,
    canViewReportHistory: true,
    canAccessDashboardIntelligence: true,
    canAccessRecurringMonitoring: true,
    canAccessProComparisonsOrFutureProFeatures: true,
    canViewWowSummary: true,
    canViewOpportunity: true,
    canViewStrengthsRisks: true,
    canViewNextActions: true,
    canViewTeaserPreview: false,
  },
};

const BILLING_REQUIRED_REASON_CODES = new Set(["ENTITLEMENT_REQUIRED", "BILLING_REQUIRED", "PLAN_REQUIRED", "UPGRADE_REQUIRED"]);
export const FOUNDER_ACCESS_REASON_CODE = "FOUNDER_PROTECTED";
const FOUNDER_EMAIL_ALLOWLIST = (process.env.NEXT_PUBLIC_FOUNDER_EMAILS ?? process.env.FOUNDER_EMAILS ?? "")
  .split(",")
  .map((value) => value.trim().toLowerCase())
  .filter(Boolean);

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

function normalizeEmail(value: string | null | undefined): string | null {
  const normalized = normalizeString(value);
  return normalized ? normalized.toLowerCase() : null;
}

export function normalizePlanTierAlias(value: string | null | undefined): CommercialTier {
  const normalized = normalizeString(value)?.toLowerCase();
  if (!normalized) {
    return "free";
  }

  return PLAN_TIER_ALIASES[normalized] ?? "free";
}

export function resolveEffectivePlanTier(entitlements: EntitlementSnapshotLike | null | undefined): CommercialTier {
  if (!entitlements) {
    return "free";
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

export function isFounderEmail(email: string | null | undefined): boolean {
  const normalizedEmail = normalizeEmail(email);
  return normalizedEmail ? FOUNDER_EMAIL_ALLOWLIST.includes(normalizedEmail) : false;
}

export function isFounderFromEntitlement(entitlements: EntitlementSnapshotLike | null | undefined): boolean {
  if (!entitlements) {
    return false;
  }

  const explicit = asBoolean(entitlements.isFounder) ?? asBoolean(entitlements.is_founder);
  if (explicit === true) {
    return true;
  }

  return resolveAccessReasonCode(entitlements) === FOUNDER_ACCESS_REASON_CODE;
}

export function applyFounderOverride<T extends EntitlementSnapshotLike>(
  entitlements: T | null | undefined,
  resolvedEmail?: string | null,
): T | null | undefined {
  if (!entitlements) {
    return entitlements;
  }

  const detectedFounderOverride = isFounderFromEntitlement(entitlements) || isFounderEmail(resolvedEmail);
  if (!detectedFounderOverride) {
    return entitlements;
  }

  const founderSource = isFounderFromEntitlement(entitlements) ? resolveEntitlementSource(entitlements) ?? "admin_override" : "admin_override";
  const founderReasonCode = isFounderFromEntitlement(entitlements)
    ? resolveAccessReasonCode(entitlements) ?? FOUNDER_ACCESS_REASON_CODE
    : FOUNDER_ACCESS_REASON_CODE;

  return {
    ...entitlements,
    isFounder: true,
    is_founder: true,
    entitlementSource: founderSource,
    entitlement_source: founderSource,
    source: founderSource,
    accessGranted: true,
    access_granted: true,
    isActive: true,
    is_active: true,
    entitled: true,
    billingRequired: false,
    billing_required: false,
    accessReasonCode: founderReasonCode,
    access_reason_code: founderReasonCode,
    reason_code: founderReasonCode,
    canUpload: true,
    can_upload: true,
    canValidateUpload: true,
    can_validate_upload: true,
    canGeneratePaidReport: true,
    can_generate_paid_report: true,
    canGenerateReport: true,
    can_generate_report: true,
    canViewOwnedReport: true,
    can_view_owned_report: true,
    canViewReports: true,
    can_view_reports: true,
    canDownloadOwnedReport: true,
    can_download_owned_report: true,
    canDownloadPdf: true,
    can_download_pdf: true,
    canAccessDashboardIntelligence: true,
    can_access_dashboard_intelligence: true,
    canAccessDashboard: true,
    can_access_dashboard: true,
    canViewReportHistory: true,
    can_view_report_history: true,
    canAccessRecurringMonitoring: true,
    can_access_recurring_monitoring: true,
    canAccessProComparisonsOrFutureProFeatures: true,
    can_access_pro_comparisons_or_future_pro_features: true,
    canViewWowSummary: true,
    can_view_wow_summary: true,
    canViewOpportunity: true,
    can_view_opportunity: true,
    canViewStrengthsRisks: true,
    can_view_strengths_risks: true,
    canViewNextActions: true,
    can_view_next_actions: true,
    canViewTeaserPreview: false,
    can_view_teaser_preview: false,
  } as T;
}

export function resolveAccessGranted(entitlements: EntitlementSnapshotLike | null | undefined): boolean {
  if (!entitlements) {
    return false;
  }

  if (isFounderFromEntitlement(entitlements)) {
    return true;
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

  if (isFounderFromEntitlement(entitlements)) {
    return false;
  }

  const explicit = asBoolean(entitlements.billingRequired) ?? asBoolean(entitlements.billing_required);
  if (typeof explicit === "boolean") {
    return explicit;
  }

  const reasonCode = resolveAccessReasonCode(entitlements);
  return reasonCode ? BILLING_REQUIRED_REASON_CODES.has(reasonCode) : false;
}

function resolveExplicitCapability(
  entitlements: EntitlementSnapshotLike,
  capability: EntitlementCapabilityKey,
): boolean | undefined {
  switch (capability) {
    case "canUpload":
      return asBoolean(entitlements.canUpload) ?? asBoolean(entitlements.can_upload);
    case "canValidateUpload":
      return asBoolean(entitlements.canValidateUpload) ?? asBoolean(entitlements.can_validate_upload);
    case "canGeneratePaidReport":
      return (
        asBoolean(entitlements.canGeneratePaidReport) ??
        asBoolean(entitlements.can_generate_paid_report) ??
        asBoolean(entitlements.canGenerateReport) ??
        asBoolean(entitlements.can_generate_report)
      );
    case "canViewOwnedReport":
      return (
        asBoolean(entitlements.canViewOwnedReport) ??
        asBoolean(entitlements.can_view_owned_report) ??
        asBoolean(entitlements.canViewReports) ??
        asBoolean(entitlements.can_view_reports)
      );
    case "canDownloadOwnedReport":
      return (
        asBoolean(entitlements.canDownloadOwnedReport) ??
        asBoolean(entitlements.can_download_owned_report) ??
        asBoolean(entitlements.canDownloadPdf) ??
        asBoolean(entitlements.can_download_pdf)
      );
    case "canViewReportHistory":
      return (
        asBoolean(entitlements.canViewReportHistory) ??
        asBoolean(entitlements.can_view_report_history) ??
        asBoolean(entitlements.canViewReports) ??
        asBoolean(entitlements.can_view_reports)
      );
    case "canAccessDashboardIntelligence":
      return (
        asBoolean(entitlements.canAccessDashboardIntelligence) ??
        asBoolean(entitlements.can_access_dashboard_intelligence) ??
        asBoolean(entitlements.canAccessDashboard) ??
        asBoolean(entitlements.can_access_dashboard)
      );
    case "canAccessRecurringMonitoring":
      return asBoolean(entitlements.canAccessRecurringMonitoring) ?? asBoolean(entitlements.can_access_recurring_monitoring);
    case "canAccessProComparisonsOrFutureProFeatures":
      return (
        asBoolean(entitlements.canAccessProComparisonsOrFutureProFeatures) ??
        asBoolean(entitlements.can_access_pro_comparisons_or_future_pro_features)
      );
    case "canViewWowSummary":
      return asBoolean(entitlements.canViewWowSummary) ?? asBoolean(entitlements.can_view_wow_summary);
    case "canViewOpportunity":
      return asBoolean(entitlements.canViewOpportunity) ?? asBoolean(entitlements.can_view_opportunity);
    case "canViewStrengthsRisks":
      return asBoolean(entitlements.canViewStrengthsRisks) ?? asBoolean(entitlements.can_view_strengths_risks);
    case "canViewNextActions":
      return asBoolean(entitlements.canViewNextActions) ?? asBoolean(entitlements.can_view_next_actions);
    case "canViewTeaserPreview":
      return asBoolean(entitlements.canViewTeaserPreview) ?? asBoolean(entitlements.can_view_teaser_preview);
    default:
      return undefined;
  }
}

export function resolveCapability(
  entitlements: EntitlementSnapshotLike | null | undefined,
  capability: EntitlementCapabilityKey,
): boolean {
  if (!entitlements) {
    return false;
  }

  if (isFounderFromEntitlement(entitlements)) {
    return capability === "canViewTeaserPreview" ? false : true;
  }

  const tier = resolveEffectivePlanTier(entitlements);
  if (!resolveAccessGranted(entitlements)) {
    return tier === "free" ? COMMERCIAL_CAPABILITY_MATRIX.free[capability] : false;
  }

  const explicit = resolveExplicitCapability(entitlements, capability);
  if (typeof explicit === "boolean") {
    return explicit;
  }

  return COMMERCIAL_CAPABILITY_MATRIX[tier][capability];
}

export function canGenerateReportFromEntitlement(entitlements: EntitlementSnapshotLike | null | undefined): boolean {
  return resolveCapability(entitlements, "canGeneratePaidReport");
}

export function canDownloadPdfFromEntitlement(entitlements: EntitlementSnapshotLike | null | undefined): boolean {
  return resolveCapability(entitlements, "canDownloadOwnedReport");
}

export function canViewOwnedReportFromEntitlement(entitlements: EntitlementSnapshotLike | null | undefined): boolean {
  return resolveCapability(entitlements, "canViewOwnedReport");
}

export function canViewReportHistoryFromEntitlement(entitlements: EntitlementSnapshotLike | null | undefined): boolean {
  return resolveCapability(entitlements, "canViewReportHistory");
}

export function canAccessDashboardFromEntitlement(entitlements: EntitlementSnapshotLike | null | undefined): boolean {
  return resolveCapability(entitlements, "canAccessDashboardIntelligence");
}

export function hasProEquivalentEntitlement(entitlements: EntitlementSnapshotLike | null | undefined): boolean {
  return resolveCapability(entitlements, "canAccessProComparisonsOrFutureProFeatures");
}

export function isProEquivalentPlanTier(planTier: string | null | undefined): boolean {
  return normalizePlanTierAlias(planTier) === "pro";
}

export function canViewWowSummaryFromEntitlement(entitlements: EntitlementSnapshotLike | null | undefined): boolean {
  return resolveCapability(entitlements, "canViewWowSummary");
}

export function canViewTeaserPreviewFromEntitlement(entitlements: EntitlementSnapshotLike | null | undefined): boolean {
  return resolveCapability(entitlements, "canViewTeaserPreview");
}
