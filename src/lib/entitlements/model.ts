export type CommercialTier = "free" | "report" | "pro";

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
    canViewReportHistory: true,
    canAccessDashboardIntelligence: true,
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
