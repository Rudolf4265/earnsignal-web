# EarnSignal Web

Next.js (App Router) single-repo app serving both:

- Marketing domain: `https://earnsignalstudio.com`
- App domain: `https://app.earnsignalstudio.com`

Hostname routing is handled by `middleware.ts` in this project.

## Local development

```bash
npm install
npm run dev
```

Optional host overrides:

```bash
NEXT_PUBLIC_MARKETING_HOST=earnsignalstudio.com
NEXT_PUBLIC_APP_HOST=app.earnsignalstudio.com
```

For local two-host testing, map hosts in `/etc/hosts`:

```txt
127.0.0.1 localhost
127.0.0.1 app.localhost
```

## Vercel domain setup (single project)

1. Deploy this repo to one Vercel project.
2. Add both domains to that same project:
   - `earnsignalstudio.com`
   - `app.earnsignalstudio.com`
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

## Manual QA checklist

### Marketing domain (`earnsignalstudio.com`)

- [ ] `/` renders landing page.
- [ ] `/pricing`, `/example`, `/privacy`, `/terms` render correctly.
- [ ] `/login`, `/signup`, `/app`, `/app/upload` redirect to `app.earnsignalstudio.com` preserving path/query.

### App domain (`app.earnsignalstudio.com`)

- [ ] `/login`, `/signup`, `/app`, `/app/upload`, `/app/report/123` render correctly.
- [ ] `/`, `/pricing`, `/example`, `/privacy`, `/terms` redirect to `earnsignalstudio.com` preserving path/query.

### Assets (both domains)

- [ ] `/_next/*`, `/favicon.ico`, `/robots.txt`, `/sitemap.xml`, `/images/*`, `/fonts/*` are never redirected.

### Local dev

- [ ] `http://localhost:3000` behaves as marketing host.
- [ ] `http://app.localhost:3000` behaves as app host.
- [ ] Redirect behavior matches production rules.

## WWW redirect loop fix

- [ ] `https://www.earnsignalstudio.com/pricing` redirects once to `https://earnsignalstudio.com/pricing`.
- [ ] `https://www.earnsignalstudio.com/login` redirects to `https://app.earnsignalstudio.com/login` (canonicalization then host routing).
- [ ] `https://earnsignalstudio.com/login` redirects to `https://app.earnsignalstudio.com/login`.

## TODOs

- Wire Supabase auth actions/forms on `/login` and `/signup`.
- Wire Stripe checkout and use URL constants from `src/lib/urls.ts` when creating sessions.
- Replace placeholder legal text on Privacy + Terms pages.

## Playwright E2E suite

### Local run

```bash
npm run e2e
npm run e2e:ui
npm run e2e:headed
```

The suite is configured in `playwright.config.ts` and runs tests under `tests/e2e`.

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
npx playwright install --with-deps
npm run build
npm run start -- --port 3000 &
npm run e2e:ci
```

Recommended CI order:
1. Build app
2. Start server on fixed port (3000)
3. Wait until app is reachable (`/livez` if available, otherwise `/login`)
4. Run Playwright tests
5. Upload `playwright-report`, `test-results`, traces/videos/screenshots on failure
