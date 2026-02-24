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

- **Site URL**: `https://app.earnsignalstudio.com`
- **Redirect URLs**:
  - `https://app.earnsignalstudio.com/**`
  - `https://earnsignalstudio.com/**`
  - `http://localhost:3000/**`

## Stripe URL notes

Centralized URL config lives in `src/lib/urls.ts`:

- `stripeSuccessUrl` = `${appBaseUrl}/app?checkout=success`
- `stripeCancelUrl` = `${marketingBaseUrl}/pricing?checkout=cancel`

Use these constants in Stripe checkout session creation.

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

## TODOs

- Wire Supabase auth actions/forms on `/login` and `/signup`.
- Wire Stripe checkout and use URL constants from `src/lib/urls.ts` when creating sessions.
- Replace placeholder legal text on Privacy + Terms pages.
