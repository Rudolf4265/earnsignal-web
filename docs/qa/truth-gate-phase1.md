# Phase 1 Truth Gate

This Playwright harness verifies the founder launch path without AI triage, PDF text parity, snapshots, or visual diffing.

## Coverage

- Auth bootstrap for free, report-tier, and pro personas.
- Upload workspace readiness against `/v1/workspace/data-sources`.
- Single-source report generation.
- Multi-source combined report generation.
- Free/report/pro entitlement surfaces.
- PDF download and `/v1/reports/{report_id}/artifact` non-empty response sanity.

## Required Environment

- `E2E_BASE_URL`
- `E2E_API_BASE_URL`
- `E2E_FREE_EMAIL`
- `E2E_FREE_PASSWORD`
- `E2E_REPORT_EMAIL`
- `E2E_REPORT_PASSWORD`
- `E2E_PRO_EMAIL`
- `E2E_PRO_PASSWORD`

Optional:

- `E2E_TEST_WORKSPACE_ID`
- `E2E_PDF_TIMEOUT_MS`
- `E2E_REPORT_RUN_TIMEOUT_MS`

The setup project logs in through the UI and writes ignored storage state files under `tests/e2e/.auth/`.
The config uses one worker because Phase 1 resets a shared report-tier QA workspace for deterministic staging checks.

## Test Accounts

Use dedicated QA accounts. The workspace tests call `/v1/workspace/clear-data` for the report-tier account before their run so staged source state is deterministic. Do not point these tests at a real customer or founder production workspace.

## Commands

Run all Phase 1 tests:

```bash
npm run qa:e2e
```

Run the release gate subset:

```bash
npm run qa:truth-gate
```

Run smoke only:

```bash
npm run qa:smoke
```

Run one spec:

```bash
npm --prefix tests/e2e exec -- playwright test --config playwright.config.ts tests/e2e/specs/report-run-single-source.spec.ts
```

Open the last HTML report:

```bash
npm run qa:e2e:report
```

## Failure Artifacts

Playwright writes the HTML report, traces on first retry, screenshots on failure, and video on failure. Start with the failing spec in the HTML report, then open the trace if the failure happened after a retry.

## Deferred To Phase 2

- Deep UI/API/PDF artifact parity.
- Golden dataset metric comparison.
- Narrative comparison.
- Visual diffing.
- AI failure triage and failure classification.
