const DEFAULT_PRIMARY_DOMAIN = "earnsigma.com";

function normalizeHost(value: string): string {
  return value.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/$/, "");
}

function parseCsv(input: string | undefined): string[] {
  if (!input) {
    return [];
  }

  return input
    .split(",")
    .map((value) => normalizeHost(value))
    .filter(Boolean);
}

export const PRIMARY_DOMAIN = normalizeHost(process.env.NEXT_PUBLIC_PRIMARY_DOMAIN ?? DEFAULT_PRIMARY_DOMAIN);

const configuredSuffixes = parseCsv(process.env.NEXT_PUBLIC_ALLOWED_HOST_SUFFIXES);

export const ALLOWED_HOST_SUFFIXES = configuredSuffixes.length > 0 ? configuredSuffixes : [".vercel.app", `.${PRIMARY_DOMAIN}`, ".localhost"];

export const AUTH_CALLBACK_ALLOWED_ORIGINS = [
  `https://${PRIMARY_DOMAIN}`,
  `https://www.${PRIMARY_DOMAIN}`,
  `https://app.${PRIMARY_DOMAIN}`,
  "http://localhost:3000",
  "http://app.localhost:3000",
  "http://127.0.0.1:3000",
];

export function getCanonicalHosts() {
  return {
    marketingHost: `www.${PRIMARY_DOMAIN}`,
    marketingRootHost: PRIMARY_DOMAIN,
    appHost: `app.${PRIMARY_DOMAIN}`,
  };
}

export function isAllowedHost(host: string): boolean {
  const normalized = normalizeHost(host);
  const { marketingHost, marketingRootHost, appHost } = getCanonicalHosts();

  return (
    normalized === marketingHost ||
    normalized === marketingRootHost ||
    normalized === appHost ||
    normalized === "localhost" ||
    normalized === "app.localhost" ||
    normalized === "127.0.0.1" ||
    ALLOWED_HOST_SUFFIXES.some((suffix) => normalized.endsWith(suffix))
  );
}

export function isAllowedAuthOrigin(origin: string): boolean {
  const normalized = origin.trim().replace(/\/$/, "");
  return AUTH_CALLBACK_ALLOWED_ORIGINS.includes(normalized);
}
