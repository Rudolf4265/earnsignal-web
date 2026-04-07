import { NextRequest, NextResponse } from "next/server";

function isDebugEnabled(): boolean {
  return process.env.NODE_ENV !== "production" && process.env.NEXT_PUBLIC_ENABLE_DEBUG === "true";
}

function previewValue(value: string | undefined, length: number): string | null {
  if (!value) {
    return null;
  }

  return value.slice(0, length);
}

export async function GET(request: NextRequest) {
  if (!isDebugEnabled()) {
    return NextResponse.json({ error: "Not Found" }, { status: 404 });
  }

  const host = request.headers.get("host");
  const userAgent = request.headers.get("user-agent");

  return NextResponse.json({
    host,
    url: request.url,
    userAgent,
    hasNextPublicSupabaseUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    hasNextPublicSupabaseAnonKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    hasNextPublicStripePublishableKey: Boolean(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY),
    hasNextPublicStripeReportPriceId: Boolean(process.env.NEXT_PUBLIC_STRIPE_REPORT_PRICE_ID),
    hasNextPublicStripeProPriceId: Boolean(process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID),
    nextPublicSupabaseUrlPreview: previewValue(process.env.NEXT_PUBLIC_SUPABASE_URL, 30),
    nextPublicStripeBillingMode: process.env.NEXT_PUBLIC_STRIPE_BILLING_MODE ?? null,
  });
}
