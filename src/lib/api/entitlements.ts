import { ApiError, apiFetchJson } from "./client";
import type {
  CheckoutCreateRequestSchema,
  CheckoutSessionResponseSchema,
  EntitlementsResponseSchema,
} from "./generated";

export type EntitlementFeatures = Record<string, boolean | undefined>;
export type EntitlementsResponse = Omit<
  EntitlementsResponseSchema,
  "plan" | "plan_tier" | "status" | "entitled" | "is_active" | "features" | "portal_url"
> & {
  plan: string | null;
  plan_tier: string | null;
  status: string | null;
  entitled: boolean;
  is_active: boolean;
  features: EntitlementFeatures;
  portal_url?: string;
};
export type CheckoutPlan = CheckoutCreateRequestSchema["plan"];
export type CheckoutResponse = {
  checkout_url: CheckoutSessionResponseSchema["checkout_url"];
};

const ENTITLEMENTS_CACHE_KEY = "earnsignal.entitlements.v1";
const ENTITLEMENTS_TTL_MS = 60_000;
const CHECKOUT_ATTEMPT_KEY = "earnsignal.checkout.attempt.v1";
const CHECKOUT_ATTEMPT_TTL_MS = 20_000;

let memoryCache: { value: EntitlementsResponse; fetchedAt: number } | null = null;
let inFlightEntitlements: Promise<EntitlementsResponse> | null = null;
let inFlightCheckout: Promise<CheckoutResponse> | null = null;

export function resetEntitlementsCache() {
  memoryCache = null;
  inFlightEntitlements = null;

  if (typeof window !== "undefined") {
    window.sessionStorage.removeItem(ENTITLEMENTS_CACHE_KEY);
  }
}

function readStorageCache(): { value: EntitlementsResponse; fetchedAt: number } | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.sessionStorage.getItem(ENTITLEMENTS_CACHE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as { value?: EntitlementsResponse; fetchedAt?: number };
    if (!parsed.value || !parsed.fetchedAt) {
      return null;
    }

    return { value: parsed.value, fetchedAt: parsed.fetchedAt };
  } catch {
    return null;
  }
}

function writeStorageCache(value: EntitlementsResponse, fetchedAt: number) {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(ENTITLEMENTS_CACHE_KEY, JSON.stringify({ value, fetchedAt }));
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

function normalizeEntitlements(value: EntitlementsResponseSchema | Record<string, unknown>): EntitlementsResponse {
  const raw = value as Record<string, unknown>;
  const features = (value.features as EntitlementFeatures | undefined) ?? {};
  const planTier = asNullableString(value.plan_tier) ?? asNullableString(value.plan) ?? null;
  const plan = planTier;
  const status = asNullableString(value.status) ?? null;
  const explicitEntitled = asBoolean(value.entitled);
  const explicitIsActive = asBoolean(value.is_active) ?? explicitEntitled;
  const featureEntitled = features.app === true || features.upload === true || features.report === true;
  const inferredIsActive = featureEntitled || status === "active" || status === "trialing";
  const isActive = explicitIsActive ?? inferredIsActive;
  const entitled = isActive;

  return {
    plan,
    plan_tier: planTier,
    status,
    entitled,
    is_active: isActive,
    features,
    portal_url: (asNullableString(raw.portal_url) ?? asNullableString(raw.portalUrl)) ?? undefined,
  };
}

export async function fetchEntitlements(options?: { forceRefresh?: boolean }): Promise<EntitlementsResponse> {
  const forceRefresh = options?.forceRefresh ?? false;

  if (!forceRefresh && memoryCache && isFresh(memoryCache.fetchedAt)) {
    return memoryCache.value;
  }

  if (!forceRefresh) {
    const storageCache = readStorageCache();
    if (storageCache && isFresh(storageCache.fetchedAt)) {
      memoryCache = storageCache;
      return storageCache.value;
    }

    if (inFlightEntitlements) {
      return inFlightEntitlements;
    }
  }

  inFlightEntitlements = (async () => {
    const body = await apiFetchJson<EntitlementsResponseSchema | Record<string, unknown>>("entitlements.fetch", "/v1/entitlements", {
      method: "GET",
    });
    const value = normalizeEntitlements(body);
    const fetchedAt = Date.now();

    memoryCache = { value, fetchedAt };
    writeStorageCache(value, fetchedAt);
    return value;
  })();

  try {
    return await inFlightEntitlements;
  } finally {
    inFlightEntitlements = null;
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

async function requestCheckout(path: string, plan: CheckoutPlan): Promise<CheckoutResponse> {
  const requestPayload: CheckoutCreateRequestSchema = { plan };
  const body = await apiFetchJson<Partial<CheckoutSessionResponseSchema> & Record<string, unknown>>("billing.checkout", path, {
    method: "POST",
    body: JSON.stringify(requestPayload),
  });
  const checkoutUrl = extractCheckoutUrl(body);

  if (!checkoutUrl) {
    throw new Error("Checkout URL missing from response");
  }

  return { checkout_url: validateCheckoutUrl(checkoutUrl) };
}

export async function createCheckoutSession(plan: CheckoutPlan): Promise<CheckoutResponse> {
  if (inFlightCheckout) {
    return inFlightCheckout;
  }

  if (hasRecentCheckoutAttempt()) {
    throw new Error("Checkout is already starting. Please wait a moment.");
  }

  setCheckoutAttemptMarker();

  inFlightCheckout = (async () => {
    try {
      return await requestCheckout("/v1/billing/checkout", plan);
    } catch (err) {
      if (!(err instanceof ApiError) || (err.status !== 404 && err.status !== 405)) {
        throw err;
      }

      return requestCheckout("/v1/checkout", plan);
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
