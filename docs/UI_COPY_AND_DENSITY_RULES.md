# UI Copy and Density Rules

Lessons about keeping the EarnSigma product UI compact, clear, and useful — without turning the main workflow into a reference manual.

---

## The Core Tension

EarnSigma has technical nuance: platform support levels, export format requirements, paid vs free subscriber distinctions, business vs context sources. The temptation is to explain all of this inline. Don't. The main workflow is for doing, not reading.

---

## Keep Main Workflow Compact

The main workflow is: upload → select sources → run report → view results.

**Each screen in this flow should answer one question:**
- Upload screen: "What platform am I uploading for, and where do I get the file?"
- Workspace screen: "What sources do I have staged right now?"
- Report creation: "What sources am I including in this run?"
- Report detail: "What does my business look like?"

If a screen answers more than one question, split the secondary question into a linked page, drawer, or tooltip.

---

## Move File Rules Into Upload Guide

File format requirements (column names, ZIP structure, accepted file types, known unsupported exports) belong in:
- `app/(app)/app/help/` — Upload Guide and platform help drawers
- Inline error messages — shown only after a specific validation failure
- Platform help drawers — expandable on demand, not always-visible

**Not in:**
- Source cards on the workspace screen
- The main upload dropzone before any error occurs
- Persistent banners visible on every page

A creator who uploads a correct file should never read a paragraph about how to format their Patreon CSV.

---

## Status First, Details Second

Show the most important thing prominently. Add detail on demand.

| Surface | Primary | On Demand |
|---|---|---|
| Source card | Status (ready / error / processing) + platform name | Date range, coverage months, replace action |
| Report list entry | Status (generating / ready / failed) + date | Source count, platform list |
| Dashboard KPI tile | Number + label | Coverage caveat, definition |
| Upload dropzone | "Upload [Platform] data" | Format requirements (link to help) |

---

## One Concept Once Per Screen

Don't explain the business/context-only distinction on every source card. Explain it once (in the report creation flow or upload guide), then use simple labels thereafter.

Don't explain what "paid subscribers" means in every KPI tile. Define it once, link to it on demand.

Don't show "This is a context-only source" on the Instagram card in the workspace, the Instagram card in source selection, and the Instagram section of the report. Once is enough.

---

## Use Plain English, Not Internal Taxonomy

| Internal term | Plain English |
|---|---|
| `full_support` | — (don't show this) |
| `supported_as_context` | "Audience data" or "Performance context" |
| `report-driving` | "Earnings data" or "Business data" |
| `WorkspaceStagedSource` | "Your saved [Platform] data" |
| `ReportRunSource` | "Sources included in this report" |
| `patreon_normalized_csv` | — (don't show this) |

Users are creators, not engineers. Use the language of their business.

---

## Don't Overexplain Report-Driving / Context-Only on Every Card

The distinction matters for eligibility (can this source drive a report alone?) but most creators don't think in those terms. Surface the consequence instead:

**Instead of:** "Instagram is a context-only source and cannot drive a report without a business-driving source."

**Use:** "Add Patreon, Substack, or YouTube earnings data to run a report." (shown when Instagram is the only staged source and the creator tries to run)

---

## Don't Bury Critical Truth

While avoiding overexplanation, don't hide genuinely important information:
- If a source has a validation error, the error must be visible without expanding a drawer.
- If a report failed, the failure state must be visible in the report list.
- If an upload is still processing, the status must be visible without polling manually.
- If a creator is on the free tier, they must know they can't generate a report before clicking Run.

The rule is: **primary state visible at a glance; details available on demand.** Not: details only.

---

## Report Success State Should Feel Like a Result, Not an Audit

When a report completes, the first thing the creator should see is a meaningful summary — their headline KPIs, a key signal, a recommended action. Not a list of data sources or a metadata panel.

The metadata (sources used, coverage period, run timestamp) is secondary. Show it in a collapsible section or a "run info" sidebar, not above the actual insights.

---

## Copy Tone

EarnSigma is a diagnostic tool for serious creators. The tone should be:
- **Direct** — "Your paid subscribers declined 8% last month." Not "We noticed some changes."
- **Specific** — Use actual numbers. Avoid vague qualifiers.
- **Businesslike** — Treat the creator as a professional, not a beginner.
- **Not alarmist** — Frame risks as information, not emergencies.
- **Not sycophantic** — Skip "Great news!" and "Amazing results." Creators want honesty.

---

## Summary: Do / Don't

| Do | Don't |
|---|---|
| Show status at a glance | Require expanding a drawer to see if a source is ready |
| Link to Upload Guide for format help | Inline format rules in main workflow |
| Define a concept once, reference it thereafter | Re-explain paid vs free subscribers on every KPI tile |
| Use plain language ("earnings data") | Use internal taxonomy ("full_support source") |
| Put insights above metadata in report view | Lead with sources used and run timestamp |
| Gate clearly with a brief upgrade prompt | Show an opaque error when entitlement fails |
| Keep source cards to status + name | Fill source cards with format documentation |
