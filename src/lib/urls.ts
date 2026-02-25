const DEFAULT_MARKETING_HOST = "earnsigma.com";
const DEFAULT_APP_HOST = "app.earnsigma.com";

const marketingHost =
  process.env.NEXT_PUBLIC_MARKETING_HOST?.trim() || DEFAULT_MARKETING_HOST;
const appHost = process.env.NEXT_PUBLIC_APP_HOST?.trim() || DEFAULT_APP_HOST;

function toBaseUrl(host: string): string {
  if (host.startsWith("http://") || host.startsWith("https://")) {
    return host.replace(/\/$/, "");
  }

  const protocol = host.includes("localhost") ? "http" : "https";
  return `${protocol}://${host}`;
}

export const marketingBaseUrl = toBaseUrl(marketingHost);
export const appBaseUrl = toBaseUrl(appHost);

export const stripeSuccessUrl = `${appBaseUrl}/app?checkout=success`;
export const stripeCancelUrl = `${marketingBaseUrl}/pricing?checkout=cancel`;
