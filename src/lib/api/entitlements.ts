import { ApiError, apiFetchJson } from "./client";
import type {
  CheckoutCreateRequestSchema,
  CheckoutSessionResponseSchema,
  EntitlementsResponseSchema,
} from "./generated";
import {
  resolveBillingRequired,
  resolveEffectivePlanTier,
  resolveEntitlementSource,
} from "../entitlements/model";

export type EntitlementFeatures = Record<string, boolean | undefined>;
export type CanonicalPlanTier = "basic" | "pro" | "none";
export type CheckoutPlan = Exclude<CanonicalPlanTier, "none">;

export type EntitlementsResponse = Omit<
  EntitlementsResponseSchema,
  | "plan"
  | "plan_tier"
  | "status"
  | "entitled"
  | "is_active"
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
  canGenerateReport: boolean;
  canViewReports: boolean;
  canDownloadPdf: boolean;
  canAccessDashboard: boolean;
  reportsRemainingThisPeriod: number | null;
  reportsGeneratedThisPeriod: number | null;
  monthlyReportLimit: number | null;
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
  features: EntitlementFeatures;
  portal_url?: string;
};

export type CheckoutResponse = {
  checkout_url: CheckoutSessionResponseSchema["checkout_url"];
};
export type BillingStatusResponse = {
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
  basic: "basic",
  plan_a: "basic",
  founder_creator_report: "basic",
  free: "basic",
  pro: "pro",
  plan_b: "pro",
  creator_pro: "pro",
};

const ACTIVE_STATUSES = new Set(["active", "trialing", "trial", "grace_period"]);
const LEGACY_PLAN_BY_CHECKOUT_PLAN: Record<CheckoutPlan, CheckoutCreateRequestSchema["plan"]> = {
  basic: "plan_a",
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
  const raw = value as Record<string, unknown>;
  const features = normalizeFeatures(raw.features);
  const effectivePlanTier = resolvePlanTier(raw);
  const explicitAccessGranted =
    asBoolean(raw.access_granted) ??
    asBoolean(raw.accessGranted) ??
    asBoolean(raw.is_active) ??
    asBoolean(raw.isActive) ??
    asBoolean(raw.entitled);
  const featureEntitled = features.app === true || features.upload === true || features.report === true;
  const inferredStatus = asNullableString(raw.status);
  const inferredStatusNormalized = typeof inferredStatus === "string" ? normalizeString(inferredStatus) : null;
  const isStatusActive = inferredStatusNormalized ? ACTIVE_STATUSES.has(inferredStatusNormalized) : false;
  const accessGranted = explicitAccessGranted ?? (featureEntitled || isStatusActive);
  const status = resolveStatus(raw, accessGranted);
  const entitlementSource = resolveEntitlementSource({
    entitlement_source: asNullableString(raw.entitlement_source),
    entitlementSource: asNullableString(raw.entitlementSource),
    source: asNullableString(raw.source),
  });
  const accessReasonCode = resolveAccessReasonCode(raw);
  const billingRequired =
    asBoolean(raw.billing_required) ??
    asBoolean(raw.billingRequired) ??
    resolveBillingRequired({
      billing_required: asBoolean(raw.billing_required),
      billingRequired: asBoolean(raw.billingRequired),
      access_reason_code: accessReasonCode,
    });
  const canUpload = asBoolean(raw.can_upload) ?? asBoolean(raw.canUpload) ?? features.upload ?? features.app ?? accessGranted;
  const canGenerateReport = asBoolean(raw.can_generate_report) ?? asBoolean(raw.canGenerateReport) ?? features.report ?? accessGranted;
  const canViewReports = asBoolean(raw.can_view_reports) ?? asBoolean(raw.canViewReports) ?? canGenerateReport;
  const canDownloadPdf = asBoolean(raw.can_download_pdf) ?? asBoolean(raw.canDownloadPdf) ?? canGenerateReport;
  const canAccessDashboard = asBoolean(raw.can_access_dashboard) ?? asBoolean(raw.canAccessDashboard) ?? features.app ?? accessGranted;
  const reportsRemainingThisPeriod =
    asNullableNumber(raw.reports_remaining_this_period) ?? asNullableNumber(raw.reportsRemainingThisPeriod) ?? null;
  const reportsGeneratedThisPeriod =
    asNullableNumber(raw.reports_generated_this_period) ?? asNullableNumber(raw.reportsGeneratedThisPeriod) ?? null;
  const monthlyReportLimit = asNullableNumber(raw.monthly_report_limit) ?? asNullableNumber(raw.monthlyReportLimit) ?? null;
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
    canGenerateReport,
    canViewReports,
    canDownloadPdf,
    canAccessDashboard,
    reportsRemainingThisPeriod,
    reportsGeneratedThisPeriod,
    monthlyReportLimit,
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
    features: legacyFeatures,
    portal_url: portalUrl,
  };
}

export async function fetchEntitlements(options?: { forceRefresh?: boolean }): Promise<EntitlementsResponse> {
  const forceRefresh = options?.forceRefresh ?? false;

  if (!forceRefresh && entitlementsMemoryCache && isFresh(entitlementsMemoryCache.fetchedAt)) {
    return entitlementsMemoryCache.value;
  }

  if (!forceRefresh) {
    const storageCache = readStorageCache<EntitlementsResponse>(ENTITLEMENTS_CACHE_KEY);
    if (storageCache && isFresh(storageCache.fetchedAt)) {
      entitlementsMemoryCache = storageCache;
      return storageCache.value;
    }

    if (inFlightEntitlements) {
      return inFlightEntitlements;
    }
  }

  inFlightEntitlements = (async () => {
    const body = await apiFetchJson<EntitlementsResponseSchema | Record<string, unknown>>("entitlements.fetch", CANONICAL_ENTITLEMENTS_PATH, {
      method: "GET",
    });
    const value = normalizeEntitlements(body);
    const fetchedAt = Date.now();

    entitlementsMemoryCache = { value, fetchedAt };
    writeStorageCache(ENTITLEMENTS_CACHE_KEY, value, fetchedAt);
    return value;
  })();

  try {
    return await inFlightEntitlements;
  } finally {
    inFlightEntitlements = null;
  }
}

export async function fetchCanonicalEntitlementSnapshot(options?: { forceRefresh?: boolean }): Promise<EntitlementsResponse> {
  return fetchEntitlements(options);
}

function isBillingStatusFresh(fetchedAt: number): boolean {
  return Date.now() - fetchedAt < BILLING_STATUS_TTL_MS;
}

function normalizeBillingStatus(value: Record<string, unknown>): BillingStatusResponse {
  const entitlements = normalizeEntitlements(value);
  const currentPeriodEnd =
    asNullableString(value.current_period_end) ??
    asNullableString(value.currentPeriodEnd) ??
    asNullableString(value.current_period_ends_at) ??
    asNullableString(value.currentPeriodEndsAt) ??
    null;
  const cancelAtPeriodEnd = asBoolean(value.cancel_at_period_end) ?? asBoolean(value.cancelAtPeriodEnd) ?? null;

  return {
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
    portalUrl: entitlements.portalUrl,
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
    const body = await apiFetchJson<Record<string, unknown>>("billing.status", BILLING_STATUS_PATH, {
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

function shouldFallbackEndpoint(error: unknown): error is ApiError {
  return error instanceof ApiError && (error.status === 404 || error.status === 405);
}

function shouldRetryWithLegacyPayload(error: unknown): error is ApiError {
  return error instanceof ApiError && (error.status === 400 || error.status === 422);
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
    throw new Error("Invalid checkout plan selected. Choose Basic or Pro.");
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
