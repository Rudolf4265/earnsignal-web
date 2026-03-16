# Patreon Members Export Support

## Overview

EarnSigma now supports the **native Patreon Members CSV export** (`patreon_members_export`) as a first-class upload type, distinct from the legacy `patreon_monthly_rollup` format.

Real Patreon creators export member data from **Patreon › Audience › Members › Export CSV**. This produces a 30-column snapshot file that is structurally different from the custom aggregated rollup format the old pipeline expected.

---

## Export Types

| Export Type | Shape | Source |
|---|---|---|
| `patreon_members_export` | 30-column member snapshot | Patreon › Audience › Members › Export CSV (**native**) |
| `patreon_monthly_rollup` | ~8-column monthly aggregation | Custom/legacy format |

---

## The 30 Canonical Columns

```
Name, Email, Discord, Patron Status, Follows You, Free Member, Free Trial,
Lifetime Amount, Pledge Amount, Charge Frequency, Tier, Addressee, Street,
City, State, Zip, Country, Phone, Patronage Since Date, Last Charge Date,
Last Charge Status, Additional Details, User ID, Last Updated, Currency,
Max Posts, Access Expiration, Next Charge Date, Full country name,
Subscription Source
```

---

## Frontend Changes (this repo)

### New modules

| File | Purpose |
|---|---|
| `src/lib/upload/patreon-csv-detector.ts` | Inspects CSV headers and classifies `patreon_members_export` vs `patreon_monthly_rollup` vs `unknown`. Returns `confidence`, `matched_fields`, `missing_fields`. |
| `src/lib/upload/patreon-members-model.ts` | Typed `PatreonMembersExportRow` and `PatreonMembersSnapshot` models. `normalizePatreonMembersRow()` maps raw CSV cells to canonical fields. |

### Detection logic

- **Header normalisation** — strips casing, whitespace, underscores, and punctuation so `Patron_Status`, `PATRON STATUS`, and `patron status` all resolve correctly.
- **Alias map** — 40+ common column header variations mapped to canonical names.
- **Confidence scoring** — critical columns (Patron Status, Pledge Amount, Patronage Since Date, Last Charge Date, Last Charge Status, User ID, Lifetime Amount, Charge Frequency) count double. Requires ≥ 4 critical columns and ≥ 40 % weighted score to accept.
- **Rollup fast-path** — presence of `From Supporter` or `To Creator` immediately classifies as `patreon_monthly_rollup`, preventing false positives.

### Schema validation states

| State | Meaning |
|---|---|
| `invalid_schema` | Headers do not match `patreon_members_export` (too few critical columns, or rollup format) |
| `empty_valid` | Valid headers but zero data rows — ingested as an empty member snapshot |
| `valid_with_rows` | Valid headers and ≥ 1 data rows — full ingest |

### Upload flow integration

When a Patreon file is selected, `buildPatreonClientContext()` runs in parallel with the SHA-256 checksum computation. If the file is confidently detected as `patreon_members_export` (or `patreon_monthly_rollup`), a `client_context` JSON string is included in the `/v1/uploads/presign` request:

```json
{ "detected_export_type": "patreon_members_export", "confidence": 0.97 }
```

The backend can read this hint to route validation to the correct schema validator instead of defaulting to `patreon_monthly_rollup`.

### Error messaging

`friendlyFailureMessage()` now handles `schema_mismatch_or_missing_columns` with a Patreon-specific explanation pointing creators to the correct export path.

---

## Backend Requirements (migration spec)

> The following changes are required in the backend service to complete the end-to-end feature.

### 1. New export type constant

Add `patreon_members_export` as a recognised `Platform` / `ExportType` enum value alongside `patreon` (rollup).

### 2. Validator routing

In the upload callback/ingestion path, read `client_context.detected_export_type` from the presign record. Route to the new `PatreonMembersValidator` when `detected_export_type == "patreon_members_export"`.

### 3. Ingestion schema

Add server-side validation matching the 30-column schema above. Accept header-only files as structurally valid with `status = "ingestion_succeeded"` and `rows_written = 0`.

### 4. Database migration — `patreon_member_snapshots` table

```sql
CREATE TABLE patreon_member_snapshots (
    id              BIGSERIAL PRIMARY KEY,
    upload_id       TEXT        NOT NULL REFERENCES uploads(id),
    creator_id      TEXT        NOT NULL,
    snapshot_date   DATE        NOT NULL,   -- date of the export file
    ingested_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Identity
    user_id         TEXT        NOT NULL,
    name            TEXT,
    email           TEXT,
    discord         TEXT,

    -- Membership
    patron_status   TEXT        NOT NULL,
    follows_you     BOOLEAN,
    free_member     BOOLEAN,
    free_trial      BOOLEAN,
    tier            TEXT,
    subscription_source TEXT,

    -- Financial (stored in minor units to avoid float rounding)
    pledge_amount_cents     BIGINT,
    lifetime_amount_cents   BIGINT,
    charge_frequency        TEXT,
    currency                CHAR(3),
    max_posts               INT,

    -- Dates
    patronage_since_date    DATE,
    last_charge_date        DATE,
    last_updated            TIMESTAMPTZ,
    next_charge_date        DATE,
    access_expiration       DATE,

    -- Charge info
    last_charge_status      TEXT,

    -- Address (optional — store as-is from export)
    addressee               TEXT,
    street                  TEXT,
    city                    TEXT,
    state                   TEXT,
    zip                     TEXT,
    country                 CHAR(2),
    full_country_name       TEXT,
    phone                   TEXT,

    -- Misc
    additional_details      TEXT,

    -- Traceability
    raw_row                 JSONB,

    UNIQUE (upload_id, user_id)
);

CREATE INDEX patreon_member_snapshots_creator_id_idx
    ON patreon_member_snapshots (creator_id, snapshot_date DESC);

CREATE INDEX patreon_member_snapshots_patron_status_idx
    ON patreon_member_snapshots (creator_id, patron_status);
```

### 5. Evidence / workspace extension

If there is an existing `creator_evidence` or workspace aggregation table, add a
`patreon_members_snapshot_id` foreign key column (nullable, additive):

```sql
ALTER TABLE creator_evidence
    ADD COLUMN patreon_members_snapshot_id BIGINT
        REFERENCES patreon_member_snapshots(id);
```

### 6. Status response

When a `patreon_members_export` upload completes ingestion, the `/v1/uploads/{id}/status` response should include:

```json
{
  "status": "ingestion_succeeded",
  "message": "Patreon member snapshot export ingested successfully.",
  "reason_code": null,
  "rows_written": { "patreon_member_snapshots": 42 }
}
```

---

## Tests

Unit tests live in `tests/patreon_csv_detector.test.mjs` and cover:

- Exact 30-column acceptance
- Shuffled column order acceptance
- Case / punctuation aliasing
- Missing critical columns rejection
- Header-only file as `empty_valid`
- Legacy `patreon_monthly_rollup` path correctness
- `normalizePatreonMembersRow` field mapping
- `buildPatreonMembersSnapshot` snapshot construction
- Edge cases (empty headers, extra whitespace, confidence bounds)

Run with: `npm test`

---

## Files Changed

| File | Change |
|---|---|
| `src/lib/upload/patreon-csv-detector.ts` | **New** — detector, schema validator |
| `src/lib/upload/patreon-members-model.ts` | **New** — row model, snapshot builder |
| `src/lib/api/generated/index.ts` | Added `client_context` to `UploadPresignRequestSchema` fallback |
| `app/(app)/app/_components/upload/upload-stepper.tsx` | Wired detection, `client_context` hint, Patreon-specific error messages |
| `tests/patreon_csv_detector.test.mjs` | **New** — full test suite |
| `tests/fixtures/patreon_members_export.csv` | **New** — 30-column sample fixture |
| `docs/patreon-members-export.md` | **New** — this file |
