# Auth troubleshooting (Next.js App Router + Supabase)

## Why this can break in browser builds

In client-side code, Next.js only inlines **static** public env references such as:

- `process.env.NEXT_PUBLIC_SUPABASE_URL`
- `process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY`

Dynamic env indexing (for example `process.env[name]` or `process.env["NEXT_PUBLIC_..."]`) is not inlined the same way and can leak runtime `process` usage into browser bundles, causing errors like `process is not defined`.

## Required environment variables

Set these values in deployment env settings and redeploy:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Do not place secrets in client code; only `NEXT_PUBLIC_*` values are intended for browser bundles.

## Quick verification checklist

1. Open `/debug/env` and confirm both required `NEXT_PUBLIC_SUPABASE_*` values are present.
2. Open browser devtools on `/login` and confirm there is no `process is not defined` error from Supabase client code.
3. Click **Continue with Google** and verify the app starts OAuth redirect flow to Google.
4. After returning to `/auth/callback`, verify you land on `/app` without an immediate bounce back to `/login`.
