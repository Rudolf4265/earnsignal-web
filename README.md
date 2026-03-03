# EarnSignal Web

Next.js (App Router) single-repo app serving both:

- Marketing domain: `https://www.earnsigma.com`
- App domain: `https://app.earnsigma.com`

Hostname routing is handled by `proxy.ts` in this project via centralized domain config (`src/lib/config/domains.ts`).

## Local development

```bash
npm ci
npm run dev
```

Domain configuration (recommended):

```bash
NEXT_PUBLIC_PRIMARY_DOMAIN=earnsigma.com
NEXT_PUBLIC_ALLOWED_HOST_SUFFIXES=.vercel.app,.localhost
```

Production host hardening note:

- In production (`NODE_ENV=production`), host routing allows only canonical hosts: `earnsigma.com`, `www.earnsigma.com`, and `app.earnsigma.com`.
- `NEXT_PUBLIC_ALLOWED_HOST_SUFFIXES` is only honored outside production (for preview/dev flexibility such as `.vercel.app`).

For local two-host testing, map hosts in `/etc/hosts`:

```txt
127.0.0.1 localhost
127.0.0.1 app.localhost
```

## Deterministic installs in CI

CI uses `npm ci` with `package-lock.json` as the source of truth for deterministic installs.
Do not edit `package.json` without committing the corresponding `package-lock.json` update.

CI installs are routed through an npm mirror registry because direct `registry.npmjs.org` access is blocked in CI.
Configure the following repository settings for GitHub Actions:

- `NPM_MIRROR_REGISTRY` (repository variable or secret): mirror URL (Artifactory/Verdaccio/GitHub Packages proxy/Azure Artifacts/Nexus)
- `NPM_TOKEN` (repository secret): read token for mirror access
- Optional `NPM_SCOPE` (repository variable): scoped registry mapping such as `@earnsigma`
- Optional `NPM_ALWAYS_AUTH` (repository variable): defaults to `true` in CI when unset

After setting the values above, re-run the CI workflow on the PR.

The workflow fails fast with a clear error when `package-lock.json` or `NPM_MIRROR_REGISTRY` is missing, and surfaces an actionable message if mirror auth fails (`401/403`) during `npm ci`.

Playwright e2e dependencies are isolated under `tests/e2e` and are not part of the default root install graph.

Expected deterministic CI failures:
- lockfile missing (`package-lock.json` guard)
- mirror auth 401/403 (token permissions)
- mirror missing packages / integrity mismatch (`npm ci` or dependency completeness check)
- registry mis-format (effective registry mismatch)

After `npm ci`, CI runs `npm ls --depth=0` as a dependency completeness check before lint/build/test.

Standard local clean build sequence (no mirror required):

```bash
rm -rf node_modules .next
npm ci
npm run lint && npm run build && npm test
```

Optional local mirror verification:

```bash
npm config set registry "https://your-mirror.example.com/"
# set token in your user-level ~/.npmrc only; never commit tokens to this repo
# example: //your-mirror.example.com/:_authToken=${NPM_TOKEN}
npm ci
npm run lint && npm run build && npm test
```

Optional local e2e sequence:

```bash
npm --prefix tests/e2e ci
npm --prefix tests/e2e exec playwright install --with-deps
npm run test:e2e
```

## Vercel domain setup (single project)

1. Deploy this repo to one Vercel project.
2. Add both domains to that same project:
   - `www.earnsigma.com`
   - `app.earnsigma.com`
3. Ensure DNS for each domain points to Vercel.
4. Do **not** create a second project for the app domain.

## Supabase Auth URL checklist

Configure Supabase Auth with:

- **Site URL**: `https://app.earnsigma.com`
- **Redirect URLs**:
  - `https://app.earnsigma.com/auth/callback`
  - `http://localhost:3000/auth/callback`

### Enable Google OAuth in Supabase

1. Go to **Supabase Dashboard → Authentication → Providers → Google**.
2. Toggle **Enable sign in with Google** on.
3. Enter your Google OAuth Client ID and Client Secret.
4. Confirm the callback URL configured in Google Cloud matches Supabase provider instructions.
5. Verify the Supabase Auth **Site URL** and **Redirect URLs** above are saved.

## Stripe URL notes

Centralized URL config lives in `src/lib/urls.ts`:

- `stripeSuccessUrl` = `${appBaseUrl}/app?checkout=success`
- `stripeCancelUrl` = `${marketingBaseUrl}/pricing?checkout=cancel`

Use these constants in Stripe checkout session creation.


## Billing entitlements troubleshooting

- Billing status is loaded from `GET /v1/entitlements` and requires a valid bearer token.
- If Billing shows **"Session expired. Please sign in again."**, click **Sign in** and re-authenticate, then refresh Billing status.

## Launch gate (internal)

- Internal checklist page: `/app/debug/launch-gate` (admin-only, non-production).
- Minimal API smoke: `npm run smoke:launch-gate` (configure `API_BASE_URL` and optional `TOKEN`).
- Full instructions: `docs/launch-gate.md`.

## Manual QA checklist

### Marketing domain (`earnsigma.com`)

- [ ] `/` renders landing page.
- [ ] `/pricing`, `/example`, `/privacy`, `/terms` render correctly.
- [ ] `/login`, `/signup`, `/app`, `/app/upload` redirect to `app.earnsigma.com` preserving path/query.

### App domain (`app.earnsigma.com`)

- [ ] `/login`, `/signup`, `/app`, `/app/upload`, `/app/report/123` render correctly.
- [ ] `/`, `/pricing`, `/example`, `/privacy`, `/terms` redirect to `earnsigma.com` preserving path/query.

### Assets (both domains)

- [ ] `/_next/*`, `/favicon.ico`, `/robots.txt`, `/sitemap.xml`, `/images/*`, `/fonts/*` are never redirected.

### Local dev

- [ ] `http://localhost:3000` behaves as marketing host.
- [ ] `http://app.localhost:3000` behaves as app host.
- [ ] Redirect behavior matches production rules.

## WWW redirect loop fix

- [ ] `https://www.earnsigma.com/pricing` redirects once to `https://earnsigma.com/pricing`.
- [ ] `https://www.earnsigma.com/login` redirects to `https://app.earnsigma.com/login` (canonicalization then host routing).
- [ ] `https://earnsigma.com/login` redirects to `https://app.earnsigma.com/login`.

## TODOs

- Wire Supabase auth actions/forms on `/login` and `/signup`.
- Wire Stripe checkout and use URL constants from `src/lib/urls.ts` when creating sessions.
- Replace placeholder legal text on Privacy + Terms pages.


### CI environment requirements

Set these environment variables in CI and hosting for deterministic domain/callback behavior:

```bash
NEXT_PUBLIC_PRIMARY_DOMAIN=earnsigma.com
NEXT_PUBLIC_ALLOWED_HOST_SUFFIXES=.vercel.app,.localhost
NEXT_PUBLIC_API_BASE_URL=https://api.earnsigma.com
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

## Playwright E2E suite

### Local run

```bash
npm --prefix tests/e2e ci
npm run test:e2e
npm run test:e2e:ui
```

The suite is configured in `tests/e2e/playwright.config.ts` and runs tests under `tests/e2e`.

### Backend stubbing model

E2E tests are deterministic and do not depend on live backend services.

- API routes are stubbed with `page.route(...)`.
- Auth session shape is mocked in browser storage and Supabase auth endpoints are routed.
- Critical API paths covered by stubs include:
  - `/v1/entitlements`
  - `/v1/billing/checkout` and fallback `/v1/checkout`
  - `/v1/uploads/presign`, `/v1/uploads/callback`, `/v1/uploads/:id/status`, `/v1/uploads/latest/status`
  - presigned storage `PUT` upload URL

### Mock test accounts

The E2E suite uses mocked account profiles rather than real users:

- `staff@earnsignal.test` (authenticated + entitled)
- `staff@earnsignal.test` with unentitled fixture
- Anonymous (no session) for redirect assertions
- Session-expired responses (`SESSION_EXPIRED`) for gate assertions

### CI recipe (generic / GitHub Actions style)

```bash
npm ci
npm --prefix tests/e2e ci
npm --prefix tests/e2e exec playwright install --with-deps
npm run build
npm run start -- --port 3000 &
npm run test:e2e
```

Recommended CI order:
1. Build app
2. Start server on fixed port (3000)
3. Wait until app is reachable (`/login`)
4. Run Playwright tests
5. Upload `playwright-report`, `test-results`, traces/videos/screenshots on failure
