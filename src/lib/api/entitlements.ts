import { ApiError, apiFetchJson } from "./client";
import type {
  BillingStatusResponseSchema,
  CheckoutCreateRequestSchema,
  CheckoutSessionResponseSchema,
  EntitlementsResponseSchema,
} from "./generated";
import {
  applyFounderOverride,
  isFounderFromEntitlement,
  resolveCapability,
  resolveBillingRequired,
  resolveEffectivePlanTier,
  resolveEntitlementSource,
} from "../entitlements/model";
import type { EntitlementSnapshotLike } from "../entitlements/model";

export type EntitlementFeatures = Record<string, boolean | undefined>;
export type CanonicalPlanTier = "free" | "report" | "pro";
export type CheckoutPlan = "report" | "pro";

export type EntitlementsResponse = Omit<
  EntitlementsResponseSchema,
  | "plan"
  | "plan_tier"
  | "source"
  | "status"
  | "entitled"
  | "is_active"
  | "can_upload"
  | "can_generate_report"
  | "can_view_reports"
  | "can_download_pdf"
  | "can_access_dashboard"
  | "reports_remaining_this_period"
  | "reports_generated_this_period"
  | "monthly_report_limit"
  | "billing_period_start"
  | "billing_period_end"
  | "features"
  | "portal_url"
  | "effective_plan_tier"
  | "entitlement_source"
  | "access_granted"
  | "access_reason_code"
  | "billing_required"
> & {
  effectivePlanTier: string;
  entitlementSource: string | null;
  accessGranted: boolean;
  accessReasonCode: string | null;
  billingRequired: boolean;
  planTier: string;
  isActive: boolean;
  source: string | null;
  status: string;
  canUpload: boolean;
  canValidateUpload: boolean;
  canGenerateReport: boolean;
  canGeneratePaidReport: boolean;
  canViewReports: boolean;
  canViewOwnedReport: boolean;
  canDownloadPdf: boolean;
  canDownloadOwnedReport: boolean;
  canAccessDashboard: boolean;
  canViewReportHistory: boolean;
  canAccessDashboardIntelligence: boolean;
  canAccessRecurringMonitoring: boolean;
  canAccessProComparisonsOrFutureProFeatures: boolean;
  canViewWowSummary: boolean;
  canViewOpportunity: boolean;
  canViewStrengthsRisks: boolean;
  canViewNextActions: boolean;
  canViewTeaserPreview: boolean;
  reportsRemainingThisPeriod: number | null;
  reportsGeneratedThisPeriod: number | null;
  monthlyReportLimit: number | null;
  billingPeriodStart: string | null;
  billingPeriodEnd: string | null;
  isFounder: boolean;
  portalUrl?: string;
  effective_plan_tier: string;
  entitlement_source: string | null;
  access_granted: boolean;
  access_reason_code: string | null;
  billing_required: boolean;
  plan: string;
  plan_tier: string;
  entitled: boolean;
  is_active: boolean;
  can_upload: boolean;
  can_validate_upload: boolean;
  can_generate_report: boolean;
  can_generate_paid_report: boolean;
  can_view_reports: boolean;
  can_view_owned_report: boolean;
  can_download_pdf: boolean;
  can_download_owned_report: boolean;
  can_access_dashboard: boolean;
  can_view_report_history: boolean;
  can_access_dashboard_intelligence: boolean;
  can_access_recurring_monitoring: boolean;
  can_access_pro_comparisons_or_future_pro_features: boolean;
  can_view_wow_summary: boolean;
  can_view_opportunity: boolean;
  can_view_strengths_risks: boolean;
  can_view_next_actions: boolean;
  can_view_teaser_preview: boolean;
  reports_remaining_this_period: number | null;
  reports_generated_this_period: number | null;
  monthly_report_limit: number | null;
  billing_period_start: string | null;
  billing_period_end: string | null;
  features: EntitlementFeatures;
  is_founder: boolean;
  portal_url?: string;
};

export type CheckoutResponse = {
  checkout_url: CheckoutSessionResponseSchema["checkout_url"];
};
export type BillingStatusResponse = Omit<
  BillingStatusResponseSchema,
  | "creator_id"
  | "checkout_configured"
  | "webhook_configured"
  | "stripe_customer_id"
  | "stripe_subscription_id"
  | "cancel_at_period_end"
  | "current_period_start"
  | "current_period_end"
  | "latest_processed_event_id"
  | "entitlements"
> & {
  creatorId: string | null;
  checkoutConfigured: boolean;
  webhookConfigured: boolean;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  latestProcessedEventId: string | null;
  currentPeriodStart: string | null;
  effectivePlanTier: string;
  entitlementSource: string | null;
  accessGranted: boolean;
  accessReasonCode: string | null;
  billingRequired: boolean;
  planTier: string;
  isActive: boolean;
  source: string | null;
  status: string;
  reportsRemainingThisPeriod: number | null;
  reportsGeneratedThisPeriod: number | null;
  monthlyReportLimit: number | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean | null;
  entitlements: EntitlementsResponse;
  portalUrl?: string;
  creator_id: string | null;
  checkout_configured: boolean;
  webhook_configured: boolean;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  latest_processed_event_id: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean | null;
  effective_plan_tier: string;
  entitlement_source: string | null;
  access_granted: boolean;
  access_reason_code: string | null;
  billing_required: boolean;
  plan: string;
  plan_tier: string;
  entitled: boolean;
  is_active: boolean;
  portal_url?: string;
};

const ENTITLEMENTS_CACHE_KEY = "earnsignal.entitlements.v1";
const ENTITLEMENTS_TTL_MS = 300_000;
const BILLING_STATUS_CACHE_KEY = "earnsignal.billing-status.v1";
const BILLING_STATUS_TTL_MS = 30_000;
const CHECKOUT_ATTEMPT_KEY = "earnsignal.checkout.attempt.v1";
const CHECKOUT_ATTEMPT_TTL_MS = 20_000;
export const CANONICAL_ENTITLEMENTS_PATH = "/v1/entitlements";
const CANONICAL_CHECKOUT_PATH = "/v1/billing/create-checkout-session";
const LEGACY_BILLING_CHECKOUT_PATH = "/v1/billing/checkout";
const LEGACY_CHECKOUT_PATH = "/v1/checkout";
const BILLING_STATUS_PATH = "/v1/billing/status";
const DEFAULT_STATUS = "inactive";

const CHECKOUT_PLAN_ALIASES: Record<string, CheckoutPlan> = {
  report: "report",
  basic: "report",
  starter: "report",
  plan_a: "report",
  founder_creator_report: "report",
  pro: "pro",
  plan_b: "pro",
  creator_pro: "pro",
};

const ACTIVE_STATUSES = new Set(["active", "trialing", "trial", "grace_period"]);
const LEGACY_PLAN_BY_CHECKOUT_PLAN: Record<CheckoutPlan, CheckoutCreateRequestSchema["plan"]> = {
  report: "plan_a",
  pro: "plan_b",
};

let entitlementsMemoryCache: { value: EntitlementsResponse; fetchedAt: number } | null = null;
let billingStatusMemoryCache: { value: BillingStatusResponse; fetchedAt: number } | null = null;
let inFlightEntitlements: Promise<EntitlementsResponse> | null = null;
let inFlightBillingStatus: Promise<BillingStatusResponse> | null = null;
let inFlightCheckout: Promise<CheckoutResponse> | null = null;

export function resetEntitlementsCache() {
  entitlementsMemoryCache = null;
  inFlightEntitlements = null;
  billingStatusMemoryCache = null;
  inFlightBillingStatus = null;

  if (typeof window !== "undefined") {
    window.sessionStorage.removeItem(ENTITLEMENTS_CACHE_KEY);
    window.sessionStorage.removeItem(BILLING_STATUS_CACHE_KEY);
  }
}

function readStorageCache<T>(key: string): { value: T; fetchedAt: number } | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.sessionStorage.getItem(key);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as { value?: T; fetchedAt?: number };
    if (!parsed.value || !parsed.fetchedAt) {
      return null;
    }

    return { value: parsed.value, fetchedAt: parsed.fetchedAt };
  } catch {
    return null;
  }
}

function writeStorageCache<T>(key: string, value: T, fetchedAt: number) {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(key, JSON.stringify({ value, fetchedAt }));
}

function isFresh(fetchedAt: number): boolean {
  return Date.now() - fetchedAt < ENTITLEMENTS_TTL_MS;
}

function asNullableString(value: unknown): string | null | undefined {
  return typeof value === "string" ? value : value === null ? null : undefined;
}

function asBoolean(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

function asNullableNumber(value: unknown): number | null | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) {
      return undefined;
    }

    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return value === null ? null : undefined;
}

function normalizeString(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  return trimmed.toLowerCase();
}

function normalizeFeatures(value: unknown): EntitlementFeatures {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  const output: EntitlementFeatures = {};
  const input = value as Record<string, unknown>;
  for (const [key, candidate] of Object.entries(input)) {
    if (typeof candidate === "boolean") {
      output[key] = candidate;
    }
  }
  return output;
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
}

function hasAnyTrue(values: Array<boolean | undefined>): boolean {
  for (const value of values) {
    if (value === true) {
      return true;
    }
  }

  return false;
}

function resolvePlanTier(raw: Record<string, unknown>): string {
  return resolveEffectivePlanTier({
    effective_plan_tier: asNullableString(raw.effective_plan_tier),
    effectivePlanTier: asNullableString(raw.effectivePlanTier),
    plan_tier: asNullableString(raw.plan_tier),
    planTier: asNullableString(raw.planTier),
    plan: asNullableString(raw.plan),
  });
}

function resolveAccessReasonCode(raw: Record<string, unknown>): string | null {
  const candidate =
    asNullableString(raw.access_reason_code) ??
    asNullableString(raw.accessReasonCode) ??
    asNullableString(raw.reason_code) ??
    asNullableString(raw.reasonCode) ??
    null;

  if (!candidate) {
    return null;
  }

  const normalized = candidate.trim().toUpperCase();
  return normalized.length > 0 ? normalized : null;
}

function resolveStatus(raw: Record<string, unknown>, isActive: boolean): string {
  const candidate =
    asNullableString(raw.status) ??
    asNullableString(raw.billing_status) ??
    asNullableString(raw.billingStatus) ??
    null;

  if (typeof candidate === "string") {
    const normalized = normalizeString(candidate);
    if (normalized) {
      return normalized;
    }
  }

  return isActive ? "active" : DEFAULT_STATUS;
}

function normalizeEntitlements(value: EntitlementsResponseSchema | Record<string, unknown>): EntitlementsResponse {
  const raw = asRecord(value);
  const features = normalizeFeatures(raw.features);
  const effectivePlanTier = resolvePlanTier(raw);
  const entitlementSource = resolveEntitlementSource({
    entitlement_source: asNullableString(raw.entitlement_source),
    entitlementSource: asNullableString(raw.entitlementSource),
    source: asNullableString(raw.source),
  });
  const accessReasonCode = resolveAccessReasonCode(raw);
  const explicitAccessGranted =
    asBoolean(raw.access_granted) ??
    asBoolean(raw.accessGranted) ??
    asBoolean(raw.is_active) ??
    asBoolean(raw.isActive) ??
    asBoolean(raw.entitled);
  const inferredStatus = asNullableString(raw.status);
  const inferredStatusNormalized = typeof inferredStatus === "string" ? normalizeString(inferredStatus) : null;
  const isStatusActive = inferredStatusNormalized ? ACTIVE_STATUSES.has(inferredStatusNormalized) : false;
  const hasPaidCapabilitySignal = hasAnyTrue([
    asBoolean(raw.can_generate_paid_report),
    asBoolean(raw.canGeneratePaidReport),
    asBoolean(raw.can_view_owned_report),
    asBoolean(raw.canViewOwnedReport),
    asBoolean(raw.can_download_owned_report),
    asBoolean(raw.canDownloadOwnedReport),
    asBoolean(raw.can_view_report_history),
    asBoolean(raw.canViewReportHistory),
    asBoolean(raw.can_access_dashboard_intelligence),
    asBoolean(raw.canAccessDashboardIntelligence),
    asBoolean(raw.can_access_recurring_monitoring),
    asBoolean(raw.canAccessRecurringMonitoring),
    asBoolean(raw.can_access_pro_comparisons_or_future_pro_features),
    asBoolean(raw.canAccessProComparisonsOrFutureProFeatures),
    asBoolean(raw.can_generate_report),
    asBoolean(raw.canGenerateReport),
    asBoolean(raw.can_view_reports),
    asBoolean(raw.canViewReports),
    asBoolean(raw.can_download_pdf),
    asBoolean(raw.canDownloadPdf),
    asBoolean(raw.can_access_dashboard),
    asBoolean(raw.canAccessDashboard),
  ]);
  const accessGranted =
    typeof explicitAccessGranted === "boolean" ? explicitAccessGranted : isStatusActive || hasPaidCapabilitySignal;
  const status = resolveStatus(raw, accessGranted);
  const billingRequired =
    asBoolean(raw.billing_required) ??
    asBoolean(raw.billingRequired) ??
    resolveBillingRequired({
      billing_required: asBoolean(raw.billing_required),
      billingRequired: asBoolean(raw.billingRequired),
      access_reason_code: accessReasonCode,
    });
  const capabilitySnapshot = {
    ...raw,
    effective_plan_tier: effectivePlanTier,
    effectivePlanTier,
    entitlement_source: entitlementSource,
    entitlementSource,
    access_granted: accessGranted,
    accessGranted,
    access_reason_code: accessReasonCode,
    accessReasonCode,
    billing_required: billingRequired,
    billingRequired,
  };
  const canUpload = resolveCapability(capabilitySnapshot, "canUpload");
  const canValidateUpload = resolveCapability(capabilitySnapshot, "canValidateUpload");
  const canGeneratePaidReport = resolveCapability(capabilitySnapshot, "canGeneratePaidReport");
  const canViewOwnedReport = resolveCapability(capabilitySnapshot, "canViewOwnedReport");
  const canDownloadOwnedReport = resolveCapability(capabilitySnapshot, "canDownloadOwnedReport");
  const canViewReportHistory = resolveCapability(capabilitySnapshot, "canViewReportHistory");
  const canAccessDashboardIntelligence = resolveCapability(capabilitySnapshot, "canAccessDashboardIntelligence");
  const canAccessRecurringMonitoring = resolveCapability(capabilitySnapshot, "canAccessRecurringMonitoring");
  const canAccessProComparisonsOrFutureProFeatures = resolveCapability(
    capabilitySnapshot,
    "canAccessProComparisonsOrFutureProFeatures",
  );
  const canViewWowSummary = resolveCapability(capabilitySnapshot, "canViewWowSummary");
  const canViewOpportunity = resolveCapability(capabilitySnapshot, "canViewOpportunity");
  const canViewStrengthsRisks = resolveCapability(capabilitySnapshot, "canViewStrengthsRisks");
  const canViewNextActions = resolveCapability(capabilitySnapshot, "canViewNextActions");
  const canViewTeaserPreview = resolveCapability(capabilitySnapshot, "canViewTeaserPreview");
  const canGenerateReport = canGeneratePaidReport;
  const canViewReports = canViewReportHistory;
  const canDownloadPdf = canDownloadOwnedReport;
  const canAccessDashboard = canAccessDashboardIntelligence;
  const reportsRemainingThisPeriod =
    asNullableNumber(raw.reports_remaining_this_period) ?? asNullableNumber(raw.reportsRemainingThisPeriod) ?? null;
  const reportsGeneratedThisPeriod =
    asNullableNumber(raw.reports_generated_this_period) ?? asNullableNumber(raw.reportsGeneratedThisPeriod) ?? null;
  const monthlyReportLimit = asNullableNumber(raw.monthly_report_limit) ?? asNullableNumber(raw.monthlyReportLimit) ?? null;
  const billingPeriodStart = asNullableString(raw.billing_period_start) ?? asNullableString(raw.billingPeriodStart) ?? null;
  const billingPeriodEnd = asNullableString(raw.billing_period_end) ?? asNullableString(raw.billingPeriodEnd) ?? null;
  const portalUrl =
    (asNullableString(raw.portal_url) ??
      asNullableString(raw.portalUrl) ??
      asNullableString(raw.customer_portal_url) ??
      asNullableString(raw.customerPortalUrl)) ??
    undefined;
  const legacyFeatures: EntitlementFeatures = {
    ...features,
    app: canAccessDashboard,
    upload: canUpload,
    report: canGenerateReport,
  };
  const isFounder = isFounderFromEntitlement(raw as EntitlementSnapshotLike);

  return {
    effectivePlanTier,
    entitlementSource,
    accessGranted,
    accessReasonCode,
    billingRequired,
    planTier: effectivePlanTier,
    isActive: accessGranted,
    source: entitlementSource,
    status,
    canUpload,
    canValidateUpload,
    canGenerateReport,
    canGeneratePaidReport,
    canViewReports,
    canViewOwnedReport,
    canDownloadPdf,
    canDownloadOwnedReport,
    canAccessDashboard,
    canViewReportHistory,
    canAccessDashboardIntelligence,
    canAccessRecurringMonitoring,
    canAccessProComparisonsOrFutureProFeatures,
    canViewWowSummary,
    canViewOpportunity,
    canViewStrengthsRisks,
    canViewNextActions,
    canViewTeaserPreview,
    reportsRemainingThisPeriod,
    reportsGeneratedThisPeriod,
    monthlyReportLimit,
    billingPeriodStart,
    billingPeriodEnd,
    isFounder,
    portalUrl,
    effective_plan_tier: effectivePlanTier,
    entitlement_source: entitlementSource,
    access_granted: accessGranted,
    access_reason_code: accessReasonCode,
    billing_required: billingRequired,
    plan: effectivePlanTier,
    plan_tier: effectivePlanTier,
    entitled: accessGranted,
    is_active: accessGranted,
    can_upload: canUpload,
    can_validate_upload: canValidateUpload,
    can_generate_report: canGenerateReport,
    can_generate_paid_report: canGeneratePaidReport,
    can_view_reports: canViewReports,
    can_view_owned_report: canViewOwnedReport,
    can_download_pdf: canDownloadPdf,
    can_download_owned_report: canDownloadOwnedReport,
    can_access_dashboard: canAccessDashboard,
    can_view_report_history: canViewReportHistory,
    can_access_dashboard_intelligence: canAccessDashboardIntelligence,
    can_access_recurring_monitoring: canAccessRecurringMonitoring,
    can_access_pro_comparisons_or_future_pro_features: canAccessProComparisonsOrFutureProFeatures,
    can_view_wow_summary: canViewWowSummary,
    can_view_opportunity: canViewOpportunity,
    can_view_strengths_risks: canViewStrengthsRisks,
    can_view_next_actions: canViewNextActions,
    can_view_teaser_preview: canViewTeaserPreview,
    reports_remaining_this_period: reportsRemainingThisPeriod,
    reports_generated_this_period: reportsGeneratedThisPeriod,
    monthly_report_limit: monthlyReportLimit,
    billing_period_start: billingPeriodStart,
    billing_period_end: billingPeriodEnd,
    features: legacyFeatures,
    is_founder: isFounder,
    portal_url: portalUrl,
  };
}

function applyFounderContext(value: EntitlementsResponse, resolvedEmail?: string | null): EntitlementsResponse {
  const founderAware = applyFounderOverride(value, resolvedEmail) as EntitlementsResponse;
  return {
    ...founderAware,
    features: {
      ...founderAware.features,
      app: founderAware.canAccessDashboard,
      upload: founderAware.canUpload,
      report: founderAware.canGenerateReport,
      wow_summary: founderAware.canViewWowSummary,
      opportunity: founderAware.canViewOpportunity,
      strengths_risks: founderAware.canViewStrengthsRisks,
      next_actions: founderAware.canViewNextActions,
      download_pdf: founderAware.canDownloadPdf,
    },
  };
}

function logEntitlementResolution(value: EntitlementsResponse, resolvedEmail?: string | null) {
  if (process.env.NODE_ENV !== "development") {
    return;
  }

  console.info("[entitlements.fetch] founder resolution", {
    resolvedEmail: resolvedEmail ?? null,
    detectedOverride: value.isFounder,
    finalEntitlements: {
      isFounder: value.isFounder,
      accessGranted: value.accessGranted,
      billingRequired: value.billingRequired,
      canViewWowSummary: value.canViewWowSummary,
      canViewOpportunity: value.canViewOpportunity,
      canViewStrengthsRisks: value.canViewStrengthsRisks,
      canViewNextActions: value.canViewNextActions,
      canAccessDashboardIntelligence: value.canAccessDashboardIntelligence,
      canDownloadPDF: value.canDownloadPdf,
    },
  });
}

export async function fetchEntitlements(options?: { forceRefresh?: boolean; resolvedEmail?: string | null }): Promise<EntitlementsResponse> {
  const forceRefresh = options?.forceRefresh ?? false;
  const resolvedEmail = options?.resolvedEmail ?? null;

  if (!forceRefresh && entitlementsMemoryCache && isFresh(entitlementsMemoryCache.fetchedAt)) {
    return applyFounderContext(entitlementsMemoryCache.value, resolvedEmail);
  }

  if (!forceRefresh) {
    const storageCache = readStorageCache<EntitlementsResponse>(ENTITLEMENTS_CACHE_KEY);
    if (storageCache && isFresh(storageCache.fetchedAt)) {
      entitlementsMemoryCache = storageCache;
      return applyFounderContext(storageCache.value, resolvedEmail);
    }

    if (inFlightEntitlements) {
      return inFlightEntitlements;
    }
  }

  inFlightEntitlements = (async () => {
    const body = await apiFetchJson<EntitlementsResponseSchema>("entitlements.fetch", CANONICAL_ENTITLEMENTS_PATH, {
      method: "GET",
    });
    const value = applyFounderContext(normalizeEntitlements(body), resolvedEmail);
    const fetchedAt = Date.now();

    entitlementsMemoryCache = { value, fetchedAt };
    writeStorageCache(ENTITLEMENTS_CACHE_KEY, value, fetchedAt);
    logEntitlementResolution(value, resolvedEmail);
    return value;
  })();

  try {
    return await inFlightEntitlements;
  } finally {
    inFlightEntitlements = null;
  }
}

export async function fetchCanonicalEntitlementSnapshot(options?: {
  forceRefresh?: boolean;
  resolvedEmail?: string | null;
}): Promise<EntitlementsResponse> {
  return fetchEntitlements(options);
}

function isBillingStatusFresh(fetchedAt: number): boolean {
  return Date.now() - fetchedAt < BILLING_STATUS_TTL_MS;
}

function resolveBillingEntitlementsPayload(
  value: BillingStatusResponseSchema | Record<string, unknown>,
): EntitlementsResponseSchema | Record<string, unknown> {
  const raw = asRecord(value);
  const nested = raw.entitlements;
  return nested && typeof nested === "object" && !Array.isArray(nested) ? (nested as Record<string, unknown>) : raw;
}

function normalizeBillingStatus(value: BillingStatusResponseSchema | Record<string, unknown>): BillingStatusResponse {
  const raw = asRecord(value);
  const entitlements = normalizeEntitlements(resolveBillingEntitlementsPayload(raw));
  const creatorId = asNullableString(raw.creator_id) ?? asNullableString(raw.creatorId) ?? null;
  const checkoutConfigured = asBoolean(raw.checkout_configured) ?? asBoolean(raw.checkoutConfigured) ?? false;
  const webhookConfigured = asBoolean(raw.webhook_configured) ?? asBoolean(raw.webhookConfigured) ?? false;
  const stripeCustomerId = asNullableString(raw.stripe_customer_id) ?? asNullableString(raw.stripeCustomerId) ?? null;
  const stripeSubscriptionId = asNullableString(raw.stripe_subscription_id) ?? asNullableString(raw.stripeSubscriptionId) ?? null;
  const latestProcessedEventId =
    asNullableString(raw.latest_processed_event_id) ?? asNullableString(raw.latestProcessedEventId) ?? null;
  const currentPeriodStart =
    asNullableString(raw.current_period_start) ??
    asNullableString(raw.currentPeriodStart) ??
    asNullableString(raw.current_period_starts_at) ??
    asNullableString(raw.currentPeriodStartsAt) ??
    entitlements.billingPeriodStart;
  const currentPeriodEnd =
    asNullableString(raw.current_period_end) ??
    asNullableString(raw.currentPeriodEnd) ??
    asNullableString(raw.current_period_ends_at) ??
    asNullableString(raw.currentPeriodEndsAt) ??
    entitlements.billingPeriodEnd;
  const cancelAtPeriodEnd = asBoolean(raw.cancel_at_period_end) ?? asBoolean(raw.cancelAtPeriodEnd) ?? null;

  return {
    creatorId,
    checkoutConfigured,
    webhookConfigured,
    stripeCustomerId,
    stripeSubscriptionId,
    latestProcessedEventId,
    currentPeriodStart,
    effectivePlanTier: entitlements.effectivePlanTier,
    entitlementSource: entitlements.entitlementSource,
    accessGranted: entitlements.accessGranted,
    accessReasonCode: entitlements.accessReasonCode,
    billingRequired: entitlements.billingRequired,
    planTier: entitlements.planTier,
    isActive: entitlements.isActive,
    source: entitlements.source,
    status: entitlements.status,
    reportsRemainingThisPeriod: entitlements.reportsRemainingThisPeriod,
    reportsGeneratedThisPeriod: entitlements.reportsGeneratedThisPeriod,
    monthlyReportLimit: entitlements.monthlyReportLimit,
    currentPeriodEnd,
    cancelAtPeriodEnd,
    entitlements,
    portalUrl: entitlements.portalUrl,
    creator_id: creatorId,
    checkout_configured: checkoutConfigured,
    webhook_configured: webhookConfigured,
    stripe_customer_id: stripeCustomerId,
    stripe_subscription_id: stripeSubscriptionId,
    latest_processed_event_id: latestProcessedEventId,
    current_period_start: currentPeriodStart,
    current_period_end: currentPeriodEnd,
    cancel_at_period_end: cancelAtPeriodEnd,
    effective_plan_tier: entitlements.effective_plan_tier,
    entitlement_source: entitlements.entitlement_source,
    access_granted: entitlements.access_granted,
    access_reason_code: entitlements.access_reason_code,
    billing_required: entitlements.billing_required,
    plan: entitlements.plan,
    plan_tier: entitlements.plan_tier,
    entitled: entitlements.entitled,
    is_active: entitlements.is_active,
    portal_url: entitlements.portal_url,
  };
}

export async function fetchBillingStatus(options?: { forceRefresh?: boolean }): Promise<BillingStatusResponse> {
  const forceRefresh = options?.forceRefresh ?? false;

  if (!forceRefresh && billingStatusMemoryCache && isBillingStatusFresh(billingStatusMemoryCache.fetchedAt)) {
    return billingStatusMemoryCache.value;
  }

  if (!forceRefresh) {
    const storageCache = readStorageCache<BillingStatusResponse>(BILLING_STATUS_CACHE_KEY);
    if (storageCache && isBillingStatusFresh(storageCache.fetchedAt)) {
      billingStatusMemoryCache = storageCache;
      return storageCache.value;
    }

    if (inFlightBillingStatus) {
      return inFlightBillingStatus;
    }
  }

  inFlightBillingStatus = (async () => {
    const body = await apiFetchJson<BillingStatusResponseSchema>("billing.status", BILLING_STATUS_PATH, {
      method: "GET",
    });
    const value = normalizeBillingStatus(body);
    const fetchedAt = Date.now();

    billingStatusMemoryCache = { value, fetchedAt };
    writeStorageCache(BILLING_STATUS_CACHE_KEY, value, fetchedAt);
    return value;
  })();

  try {
    return await inFlightBillingStatus;
  } finally {
    inFlightBillingStatus = null;
  }
}

function extractCheckoutUrl(payload: Partial<CheckoutSessionResponseSchema> & Record<string, unknown>): string | null {
  const checkoutUrl =
    (payload.checkout_url as string | undefined) ??
    (payload.checkoutUrl as string | undefined) ??
    (payload.url as string | undefined);

  if (!checkoutUrl || typeof checkoutUrl !== "string") {
    return null;
  }

  return checkoutUrl;
}

function validateCheckoutUrl(rawUrl: string): string {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== "https:") {
      throw new Error("Checkout URL must use HTTPS");
    }

    return parsed.toString();
  } catch {
    throw new Error("Invalid checkout URL returned by billing API");
  }
}

function hasRecentCheckoutAttempt(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const raw = window.sessionStorage.getItem(CHECKOUT_ATTEMPT_KEY);
  if (!raw) {
    return false;
  }

  const parsedTs = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsedTs)) {
    window.sessionStorage.removeItem(CHECKOUT_ATTEMPT_KEY);
    return false;
  }

  if (Date.now() - parsedTs >= CHECKOUT_ATTEMPT_TTL_MS) {
    window.sessionStorage.removeItem(CHECKOUT_ATTEMPT_KEY);
    return false;
  }

  return true;
}

function setCheckoutAttemptMarker() {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(CHECKOUT_ATTEMPT_KEY, String(Date.now()));
}

function clearCheckoutAttemptMarker() {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.removeItem(CHECKOUT_ATTEMPT_KEY);
}

export function checkoutAttemptInProgress(): boolean {
  return hasRecentCheckoutAttempt();
}

export function clearCheckoutAttempt() {
  clearCheckoutAttemptMarker();
}

function normalizeCheckoutPlan(plan: CheckoutPlan | string): CheckoutPlan | null {
  const normalized = normalizeString(String(plan));
  if (!normalized) {
    return null;
  }

  return CHECKOUT_PLAN_ALIASES[normalized] ?? null;
}

function toLegacyCheckoutPlan(plan: CheckoutPlan): CheckoutCreateRequestSchema["plan"] {
  return LEGACY_PLAN_BY_CHECKOUT_PLAN[plan];
}

// Endpoint fallback applies only when the endpoint itself is absent (404/405).
// Auth errors (401/403), billing config errors (503), and all other failures
// are surfaced immediately — they apply to all endpoints equally.
function shouldFallbackEndpoint(error: unknown): error is ApiError {
  return error instanceof ApiError && (error.status === 404 || error.status === 405);
}

// Legacy payload retry applies only for request-format compatibility errors
// (older backend versions may not accept plan_tier and return 400/422).
// Auth errors (401/403) are explicitly excluded: they indicate a session or
// permission problem that a different payload cannot resolve.
function shouldRetryWithLegacyPayload(error: unknown): error is ApiError {
  if (!(error instanceof ApiError)) return false;
  if (error.status === 401 || error.status === 403) return false;
  return error.status === 400 || error.status === 422;
}

async function requestCheckout(path: string, payload: Record<string, unknown>): Promise<CheckoutResponse> {
  const body = await apiFetchJson<Partial<CheckoutSessionResponseSchema> & Record<string, unknown>>("billing.checkout", path, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  const checkoutUrl = extractCheckoutUrl(body);

  if (!checkoutUrl) {
    throw new Error("Checkout URL missing from response");
  }

  return { checkout_url: validateCheckoutUrl(checkoutUrl) };
}

export async function createCheckoutSession(plan: CheckoutPlan | string): Promise<CheckoutResponse> {
  if (inFlightCheckout) {
    return inFlightCheckout;
  }

  const normalizedPlan = normalizeCheckoutPlan(plan);
  if (!normalizedPlan) {
    throw new Error("Invalid checkout plan selected. Choose Report or Pro.");
  }

  if (hasRecentCheckoutAttempt()) {
    throw new Error("Checkout is already starting. Please wait a moment.");
  }

  setCheckoutAttemptMarker();

  inFlightCheckout = (async () => {
    try {
      try {
        return await requestCheckout(CANONICAL_CHECKOUT_PATH, { plan_tier: normalizedPlan });
      } catch (error) {
        if (!shouldRetryWithLegacyPayload(error)) {
          throw error;
        }

        return requestCheckout(CANONICAL_CHECKOUT_PATH, { plan: toLegacyCheckoutPlan(normalizedPlan) });
      }
    } catch (err) {
      if (!shouldFallbackEndpoint(err)) {
        throw err;
      }

      try {
        return await requestCheckout(LEGACY_BILLING_CHECKOUT_PATH, { plan: toLegacyCheckoutPlan(normalizedPlan) });
      } catch (legacyError) {
        if (!shouldFallbackEndpoint(legacyError)) {
          throw legacyError;
        }

        return requestCheckout(LEGACY_CHECKOUT_PATH, { plan: toLegacyCheckoutPlan(normalizedPlan) });
      }
    }
  })();

  try {
    return await inFlightCheckout;
  } catch (err) {
    clearCheckoutAttemptMarker();
    throw err;
  } finally {
    inFlightCheckout = null;
  }
}

export { extractCheckoutUrl, validateCheckoutUrl };
