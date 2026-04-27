# Product UX Model

Core UX model for EarnSigma's authenticated product app.

---

## Model in One Sentence

Users upload data exports to a persistent workspace, explicitly select which saved sources participate in a report run, and view/download the resulting business diagnostic report.

---

## The Workspace

The workspace (`/app/data`) is the creator's data inventory. It holds the **latest valid staged data per platform**.

### Workspace UX Rules

| Rule | UX Implication |
|---|---|
| One slot per platform | Uploading Patreon replaces the Patreon slot only. Other slots unchanged. |
| Persists across runs | Running a report does not clear workspace data. |
| Explicit clear-all | Clearing all data is an explicit user action with a confirmation step. |
| Shows current state | Workspace shows what's staged now, not what was in the last report. |
| No auto-inclusion | Sources in the workspace are not automatically in the next report. |

### What Source Cards Should Show

Source cards should be **light** — status-first, not a documentation panel.

| Show | Don't Show |
|---|---|
| Platform name and icon | Full upload format instructions |
| Upload date / freshness | Schema column names |
| Status (ready / processing / error) | Detailed validation error codes |
| Coverage period (date range) | Internal source family identifiers |
| Remove / replace action | "Why this platform matters" explanations |

Detailed file format rules and platform-specific upload instructions belong in the **Upload Guide** (`/app/help`), not on workspace source cards.

---

## Explicit Per-Run Source Selection

When a creator runs a report, they explicitly choose which staged workspace sources to include. This is the source selection step.

### Source Selection UX Rules

| Rule | UX Implication |
|---|---|
| Defaults remembered | Show last-used selection as the default. |
| User can change selection | Allow adding/removing sources before confirming the run. |
| Clear-all respected | If user cleared all data, no sources auto-populate. |
| Eligibility from backend | Only show sources the backend confirms as eligible for this run. |
| Minimum required | At least one business/report-driving source required. Show clear feedback if not met. |

### Compact Run Summary

The run configuration (which sources are selected) should appear **near the Run Report action** — compact, scannable, not buried below fold. The creator must be able to confirm what they're including before submitting.

---

## Remembered Defaults

- On the next report run, pre-select the same sources the creator used last time.
- Remembered defaults must reflect the current workspace state. If a source was cleared, it must not appear in the default selection.
- Remembered defaults are a convenience. They do not override explicit user changes.

---

## Clear All Data

- "Clear all data" removes all staged workspace sources for the creator.
- Must require explicit confirmation (destructive action).
- After clear-all, the workspace shows empty state.
- After clear-all, the next run has no pre-selected sources.

---

## Current Run vs History

| Surface | What It Shows |
|---|---|
| Dashboard | Derived from the most recent completed report run |
| Report list | All report runs (queued, running, succeeded, failed) |
| Report detail | Content and metrics from a specific completed run |
| Workspace | Current staged sources (independent of any specific run) |

The dashboard is **not** a live view of the workspace. It reflects the last completed report. Users who want to run a fresh report go to the report creation flow, not the dashboard.

---

## Upload Guide Owns Detailed File Rules

The main upload flow (`/app/data`) must not become a file format manual. Platform-specific format requirements, known unsupported export types, and troubleshooting steps belong in:
- **Upload Guide / Help** (`/app/help`)
- **Platform-specific help drawers** (expandable, not always-visible)
- **Inline error messages** triggered only when a specific error occurs

The main workflow should guide the creator to upload, select sources, and run a report — not educate them about CSV column schemas.

---

## Do / Don't Summary

| Do | Don't |
|---|---|
| Show platform status at a glance | Show format documentation on every source card |
| Confirm source selection before running | Auto-include all workspace sources |
| Remember last selection as default | Require re-selection from scratch every run |
| Show compact run summary near "Run Report" | Bury source confirmation below fold |
| Link to Upload Guide for format help | Inline format rules in main workflow |
| Show clear feedback when eligibility requirement not met | Silently disable the Run button |
| Confirm before clear-all | Clear data without a confirmation dialog |
