# Instagram Export Support — Developer Reference

## Status summary

| Export family | Status | End-to-end ingestion | Frontend model |
|---|---|---|---|
| `instagram_content_export` | **SUPPORTED** | Yes | `instagram-content-model.ts` |
| `instagram_insights_export` | **RECOGNIZED** | No (detection + routing only) | — |
| `instagram_audience_export` | **RECOGNIZED** | No (detection + routing only) | — |

---

## Export families

### instagram_content_export — SUPPORTED

Per-post/reel performance metrics exported from Meta Business Suite › Content › Export
or Instagram Creator Studio.

**Canonical columns** (12 total, 5 critical):

| Canonical column | Critical | Aliases accepted |
|---|---|---|
| `permalink` | | post url, url, link, post link |
| `description` | | caption, text, post caption |
| `post type` | | content type, media type |
| `publish time` | ✓ | publish date, published at, date posted |
| `impressions` | ✓ | video views, view count |
| `reach` | ✓ | unique reach |
| `likes` | ✓ | like count, reactions |
| `comments` | | comment count |
| `shares` | | share count, reposts |
| `saves` | ✓ | save count, bookmarks |
| `profile visits` | | profile activity, profile clicks |
| `follows` | | new followers, follow count |

**Minimum detection thresholds**: ≥ 2 critical columns, confidence ≥ 0.30.

**Capability flags** (derived from field presence):

| Flag | Condition |
|---|---|
| `has_rows` | At least one data row |
| `supports_time_series` | `publish time` present |
| `supports_reach_impressions` | `reach` or `impressions` present |
| `supports_saves` | `saves` present |
| `supports_profile_actions` | `profile visits` or `follows` present |
| `supports_shares` | `shares` present |
| `supports_content_type_breakdown` | `post type` present |
| `supports_permalink` | `permalink` present |

**Validation states**:
- `valid_with_rows` — correct schema + ≥ 1 data row → ingested normally
- `empty_valid` — correct schema + 0 data rows → empty snapshot accepted
- `invalid_schema` — headers don't match → clear error shown

**Analytics available** (only when corresponding capability flag is true):
- Total post count
- Total impressions / reach / likes / comments / shares / saves
- Content-type distribution (Photo vs Reel vs Story etc.)
- Posting cadence / publish-time range
- Top-performing posts by reach or saves (if row count allows)

---

### instagram_insights_export — RECOGNIZED

Account-level daily/weekly time-series insights from Meta Business Suite › Insights › Export.

**Canonical columns** (11 total, 3 critical):

`date`, `reach`, `impressions`, `profile views`, `website clicks`, `email button clicks`,
`follows`, `unfollows`, `accounts engaged`, `accounts reached`, `content interactions`

**Differentiator columns** (boost classification confidence):
`accounts engaged`, `accounts reached`, `unfollows`, `content interactions`,
`website clicks`, `email button clicks`, `profile views`

**Validation state**: `recognized_not_implemented` — file is received and acknowledged.
Backend emits an honest status; no ingestion occurs yet.

**To promote to SUPPORTED**: implement ingestion handler, `instagram_insights_snapshots` DB table,
analytics module, and return `valid_with_rows` / `empty_valid` from the validator.

---

### instagram_audience_export — RECOGNIZED

Audience demographic snapshots from Meta Business Suite audience insights.

**Canonical columns** (15 total, 1 critical):

`date`, `followers`, `follows`, `top cities`, `top countries`,
`age 13 17`, `age 18 24`, `age 25 34`, `age 35 44`, `age 45 54`, `age 55 64`, `age 65`,
`men`, `women`, `other`

> Note: age-range column names are stored in normalised form (dash → space, `+` stripped).
> "Age 18-24" → `age 18 24`. "Age 65+" → `age 65`.

**Differentiator columns**: age buckets, `top cities`, `top countries`

**Validation state**: `recognized_not_implemented`

**To promote to SUPPORTED**: implement ingestion handler, `instagram_audience_snapshots` DB table,
analytics module for audience demographics, and update validation routing.

---

## Detection architecture

Detection is performed in `src/lib/upload/instagram-csv-detector.ts`.

**Flow**:
1. Normalise all input headers (`normalizeHeader`: lowercase, BOM-strip, dash/underscore → space, strip non-alphanumeric).
2. Score each family using weighted critical/non-critical column matching + alias resolution.
3. Apply signature fast-path: columns that appear only in one family (e.g. `saves`, `permalink` for content; `accounts engaged` for insights; `followers` for audience) break ties deterministically.
4. If multiple families pass their threshold, pick highest confidence; content beats insights on tie.
5. Return `unknown` if no family meets its minimum threshold.

**Disambiguation precedence**:
1. Content signature columns (`saves`, `permalink`, `post type`, `publish time`) → content wins
2. Audience signature columns (`followers`, age buckets) → audience wins
3. Insights signature columns (`accounts engaged`, `unfollows`) → insights wins
4. Mixed or ambiguous → score comparison; content > audience > insights on tie

---

## Adding a new Instagram export family

1. Define canonical columns and critical/differentiator column sets in `instagram-csv-detector.ts`.
2. Add an alias map (`INSTAGRAM_<FAMILY>_ALIASES`).
3. Add a `score<Family>` scorer (or use the generic `scoreFamily()` helper).
4. Add signature detection in `hasXxxSignature()`.
5. Extend `detectInstagramExportType()` with the new family path.
6. Extend `validateInstagramSchema()` to return appropriate state.
7. Create a model file (`instagram-<family>-model.ts`) with typed row model + snapshot builder.
8. Add a fixture CSV under `tests/fixtures/`.
9. Add tests in `tests/instagram_csv_detector.test.mjs`.
10. Update this document.

---

## File map

| File | Purpose |
|---|---|
| `src/lib/upload/instagram-csv-detector.ts` | Detection, disambiguation, schema validation for all 3 families |
| `src/lib/upload/instagram-content-model.ts` | Row model, snapshot builder, capability flags, analytics for content export |
| `src/lib/upload/platform-metadata.ts` | Instagram enabled (`available: true`, category `"supported"`) |
| `app/(app)/app/_components/upload/upload-stepper.tsx` | `buildInstagramClientContext`, Instagram error messages |
| `tests/instagram_csv_detector.test.mjs` | Comprehensive unit tests (50+ cases) |
| `tests/fixtures/instagram_content_export.csv` | Synthetic but schema-aligned content fixture (10 rows) |
| `tests/fixtures/instagram_insights_export.csv` | Synthetic insights fixture (14 rows, RECOGNIZED) |
| `tests/fixtures/instagram_audience_export.csv` | Synthetic audience fixture (8 weekly snapshots, RECOGNIZED) |
