import { getCanonicalHosts } from "./config/domains";

const { marketingHost, appHost } = getCanonicalHosts();

function toBaseUrl(host: string): string {
  if (host.startsWith("http://") || host.startsWith("https://")) {
    return host.replace(/\/$/, "");
  }

  const protocol = host.includes("localhost") ? "http" : "https";
  return `${protocol}://${host}`;
}

export const marketingBaseUrl = toBaseUrl(marketingHost);

// NEXT_PUBLIC_APP_URL overrides the derived app host so local dev on localhost:3000
// does not produce absolute links to app.localhost (which requires /etc/hosts setup).
// In production this variable is not set and the value is derived from PRIMARY_DOMAIN.
const _configuredAppUrl = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");
export const appBaseUrl = _configuredAppUrl || toBaseUrl(appHost);

export const stripeSuccessUrl = `${appBaseUrl}/app/billing/success`;
export const stripeCancelUrl = `${appBaseUrl}/app/billing/cancel`;
