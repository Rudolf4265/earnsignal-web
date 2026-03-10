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
export const appBaseUrl = toBaseUrl(appHost);

export const stripeSuccessUrl = `${appBaseUrl}/app/billing/success`;
export const stripeCancelUrl = `${appBaseUrl}/app/billing/cancel`;
