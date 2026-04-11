import { NextResponse } from "next/server";

function isDebugEnabled(): boolean {
  return process.env.NODE_ENV !== "production" && process.env.NEXT_PUBLIC_ENABLE_DEBUG === "true";
}

export async function GET() {
  if (!isDebugEnabled()) {
    return NextResponse.json({ error: "Not Found" }, { status: 404 });
  }

  // SECURITY: Only expose boolean presence checks — never leak partial values,
  // request metadata (host, url, userAgent), or anything that aids reconnaissance.
  return NextResponse.json({
    hasNextPublicSupabaseUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    hasNextPublicSupabaseAnonKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    hasNextPublicStripePublishableKey: Boolean(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY),
    hasNextPublicStripeReportPriceId: Boolean(process.env.NEXT_PUBLIC_STRIPE_REPORT_PRICE_ID),
    hasNextPublicStripeProPriceId: Boolean(process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID),
    hasNextPublicStripeBillingMode: Boolean(process.env.NEXT_PUBLIC_STRIPE_BILLING_MODE),
  });
}
