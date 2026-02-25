import { NextRequest, NextResponse } from "next/server";

function previewValue(value: string | undefined, length: number): string | null {
  if (!value) {
    return null;
  }

  return value.slice(0, length);
}

export async function GET(request: NextRequest) {
  const host = request.headers.get("host");
  const userAgent = request.headers.get("user-agent");

  return NextResponse.json({
    host,
    url: request.url,
    userAgent,
    hasNextPublicSupabaseUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    hasNextPublicSupabaseAnonKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    nextPublicSupabaseUrlPreview: previewValue(process.env.NEXT_PUBLIC_SUPABASE_URL, 30),
  });
}
