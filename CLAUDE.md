Read `docs/CODEX_START_HERE.md` before making changes.

## Verify the premise against the real system before acting on it, not after

Incidents across EarnSigma have come from **unverified assumptions about the
running system**, not from careless edits. Check the belief against the real
thing *before* you act on it. Verifying afterwards catches the damage; it does
not prevent it.

The traps here are different from the backend's — do not port `creator_optimizer`
habits over without checking. All facts below were read from the live systems on
2026-08-21; re-verify rather than trusting them as they age.

### Deployment config is not in this repo

This app deploys to **Vercel** (project `earnsignal-web`, team "Rudolf's
projects"), serving `app.earnsigma.com`, `www.earnsigma.com` and `earnsigma.com`.

There is **no `vercel.json` and no `.vercel/project.json`**. Build command,
install command, Node version, framework preset and environment variables exist
*only* in the Vercel dashboard. Nothing you change in this repo alters them.

This is the mirror image of the backend, where `render.yaml` **is** authoritative
and a push rewrites live service config. Same lesson, opposite direction: know
which one you are in before claiming a config change will take effect.

### Known mismatch: CI does not test what production runs

    Vercel (production)  Node 24.x
    GitHub Actions CI    Node 20

Verified 2026-08-21. A four-major-version gap, so CI passing is not evidence the
production build works. The backend had exactly this bug with Python 3.11/3.12
and it broke a deploy. There is no `engines` field in `package.json` and no
`.nvmrc`, so nothing in the repo pins either side.

### Dependencies are already reproducible — do not "fix" them

`package-lock.json` is tracked and CI uses `npm ci`, so the `^` ranges in
`package.json` do not float at install time. The backend's pin-everything lesson
came from `requirements.txt` having floor constraints and no lockfile. **That
problem does not exist here.** Pinning `package.json` would be cargo-culting.

### Two cross-repo guards pass by skipping

Both exit successfully when their input is missing, so a green CI run does not
mean they checked anything:

- **`api:generate:check`** — `exit 0` when `OPENAPI_SCHEMA_URL` is unset
  (`.github/workflows/ci.yml`, and again inside
  `scripts/generate-openapi-types.mjs`). While unset,
  `src/lib/api/generated/schema.ts` can drift from the backend's OpenAPI
  indefinitely with nothing detecting it.
- **`source-manifest:generate:check`** — skips when `creator_optimizer` is not
  available as a sibling checkout or via `CREATOR_OPTIMIZER_REPO`.

Before trusting either, confirm the input is actually present in the run.

### Before you

- **claim a deploy-config change will take effect** → there is no `vercel.json`;
  check the Vercel dashboard or API. In `creator_optimizer` the opposite holds.
- **claim CI proves the build works** → CI is Node 20, production is Node 24.x.
- **touch `src/lib/api/generated/schema.ts`** → it is generated. Regenerate with
  `npm run api:generate` against the backend's OpenAPI; do not hand-edit.
- **trust a green `:check` script** → confirm it did not take its skip path.

**The blind spot is deploy time.** Anything that only breaks during build or
deploy — a different Node major, a dashboard-only setting, a skipped guard —
cannot be caught by running the suite locally. Watch the deploy after pushing and
read the result back.
