# E2E Test Results — May 23, 2026

Auto-detect upload flow + report output validation across Lena (06) and Priya (04) personas.

---

## Upload Flow — Auto-Detection Results

| File | Platform | Detection | Confidence | Result |
|---|---|---|---|---|
| Patreon.csv (30-col native) | Patreon | ✅ Auto-detected | 100% | Uploaded |
| YouTube.zip (Studio export) | YouTube | ✅ Auto-detected | 95% | Uploaded |
| Substack.csv (native export) | Substack | ❌ Failed → manual chip | — | Fixed (see below) |
| Instagram.zip (native export) | Instagram | ✅ Auto-detected | 95% | Uploaded |
| TikTok.zip (combined export) | TikTok | ❌ Failed → manual chip | — | Backend rejected |
| Sponsorship.csv (EarnSigma template) | Additional Income | ❌ Chip missing | — | Cannot upload |

### Detection Bugs Found

**BUG 1 — Substack CSV fingerprint mismatch (FIXED)**
`platform-detector.ts` expected `"subscription type"`, `"subscription started at"`, `"paid at"`, `"free subscription started at"` — none of which exist in the real Substack export.

Real export headers: `email, name, subscription_status, plan, created_at, expiry`

Fix: Updated `SUBSTACK_SIGNATURE_HEADERS` to match actual columns. TypeScript check passes. Needs `git commit` — change is in working tree at `src/lib/upload/platform-detector.ts`.

**BUG 2 — TikTok combined ZIP rejected by backend (test data issue)**
The persona TikTok.zip is a combined export containing all export types (Followers + Viewers + Overview + Content merged). The backend and frontend detector both correctly reject this — they expect individual separate ZIPs (Followers OR Viewers OR Overview). Test data needs individual ZIPs for proper TikTok E2E coverage.

**BUG 3 — "Additional Income" chip missing from manual platform picker (UNFIXED)**
When a file fails auto-detection, the "Platform not recognized — select manually" chip row shows: Patreon, Substack, YouTube, Instagram, TikTok. The "Additional Income" (platform: `"other"`) chip is absent because `PLATFORM_EXPORT_LINKS` in `source-manifest-static.generated.ts` doesn't include it. Sponsorship CSV cannot be uploaded via the auto-detect flow.

Fix needed: Add `"other"` entry to the chip picker in `upload-stepper.tsx`.

---

## Report Output — Lena (06)

**Sources:** Patreon + YouTube (2 sources)
**Report ID:** `231fb9e0-a1de-4c6d-8c4a-f5543669915b`

### ✅ Passes
- Source count label correct: "2 SOURCES INCLUDED"
- Paid subscribers correctly labeled (not total)
- YouTube correctly categorised as discovery/audience signal
- LLM produces specific numeric values
- Actionable recommendations with correct framing
- Revenue chart renders with correct history window

### ❌ Bugs
1. **Lowercase opening sentence** — Report section 5 headline opens "patreon still sets the floor..." (lowercase `p`). All other headlines correctly capitalised.
2. **"Medium confidence because confidence medium."** — Churn Risk note in subscriber structure table is a tautological copy error. Should be a plain-language explanation of what makes churn confidence medium.
3. **"Tier-level detail was not included in this export."** shown for Paid Subscribers, Churn Rate, ARPU — even though the uploaded Patreon CSV is the full 30-column native members export with a `tier` column. The backend parser doesn't aggregate member rows by tier from the native export.

---

## Report Output — Priya (04)

**Sources:** Patreon + Substack + YouTube + Instagram (4 sources)
**Report ID:** `5fe9967c-a8b2-400c-8592-65cfb895c9c6`

### ✅ Passes
- Source count label correct: "4 SOURCES INCLUDED"
- Revenue chart correct: $3,847, "Up 192.5% vs start — Dec 2025 to May 2026"
- Paid subscribers labeled correctly (552)
- ARPU ($7) with actionable framing about pricing leverage ✅
- Churn Outlook with hedged language about partial data ✅
- YouTube correctly framed as "discovery signal, not a revenue source" ✅
- Instagram included in audience signals section ✅
- Action plan steps are specific and time-boxed ("This month", "Next cycle") ✅
- Methodology section correctly lists all 4 included sources ✅
- All section headlines correctly capitalised ✅

### ❌ Bugs
1. **"Leading source" label applied to wrong platform** — Platform concentration section labels Patreon ($1,405 / 37%) as "Leading source" and Substack ($2,442 / 63%) as "Meaningful support". Patreon is ranked first despite having less revenue. The backend's lead platform logic appears to use upload order or alphabetical sort rather than revenue share.

2. **Report headline contradicts data** — "Patreon still leads, but the business is starting to widen." Patreon is at 37% vs Substack at 63%. The LLM generates the headline based on the backend-assigned "lead platform" label, which is wrong. If the platform label bug (#1) is fixed, the headline should self-correct.

3. **Substack called "second revenue pillar"** in section 8 (Opportunities) and section 9 (Action plan): "Scale Substack as the second revenue pillar" — Substack is already the primary revenue source at 63%. This is directly caused by bug #1 (wrong lead platform assignment).

4. **"Medium confidence because confidence medium."** — Same tautological churn note as Lena's report. Affects both reports. Backend copy bug.

5. **"Tier-level detail was not included in this export."** shown for Paid Subscribers, Churn Rate, ARPU — Same as Lena. Expected for Substack (no tiers), but incorrect for Patreon.

6. **Conflicting strengths/risks** — Section 7 simultaneously says "Churn rate decreased versus the prior comparable report" (strength) and "Churn risk score increased versus the prior comparable report" (risk). Without explanation of the distinction, this reads as contradictory.

---

## Priority Fix List

| Priority | Bug | Scope |
|---|---|---|
| P0 | Lead platform assignment uses wrong ordering (not revenue share) | Backend `facts.py` / `reports.py` |
| P0 | "Medium confidence because confidence medium." tautology | Backend copy/template |
| P1 | Substack fingerprint fix needs commit + deploy | Frontend — change in working tree |
| P1 | "Additional Income" chip missing from manual platform picker | Frontend `upload-stepper.tsx` |
| P1 | Patreon native members export tier aggregation not implemented | Backend parser |
| P2 | Lowercase opening sentence in section 5 LLM output | Backend prompt template |
| P2 | TikTok combined ZIP test data — need individual export ZIPs for proper coverage | Test data |

---

## What Needs Committing

```bash
# In earnsignal-web — Substack fingerprint fix is in working tree, lock file is stale:
# From your terminal (not sandbox):
cd /path/to/earnsignal-web
git add src/lib/upload/platform-detector.ts
git commit -m "fix(upload): update Substack CSV fingerprint to match real export headers"
git push
```
