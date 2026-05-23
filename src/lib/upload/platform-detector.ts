/**
 * Platform auto-detector for the EarnSigma upload flow.
 *
 * Delegates to existing detectors where possible:
 *   - Patreon CSV  → patreon-csv-detector (30-column Members export)
 *   - ZIP files    → zip-intake (YouTube Studio / Instagram / TikTok ZIP shapes)
 *
 * Additional lightweight fingerprints cover:
 *   - Substack native subscriber export
 *   - YouTube Studio Table data CSV
 *
 * Tier 2 (recognized-but-unsupported) platforms produce an `isKnownUnsupported`
 * result so the UI can display a friendly "not yet supported" card rather than a
 * generic "platform not recognised" message.
 *
 * Safety contract:
 *   - This module never throws. All detection errors are caught and return
 *     { platform: null, confidence: 0, label: "Unknown", isKnownUnsupported: false }.
 *   - Detection is purely informational. The upload pipeline still validates on the
 *     backend. A wrong detection just means the user sees the wrong chip pre-selected;
 *     the runUpload guard and backend validators catch real mismatches.
 */

import { detectPatreonExportType } from "./patreon-csv-detector";
import { inspectZipArchiveBuffer, isZipUploadCandidate } from "./zip-intake";
import type { UploadPlatform } from "../api/upload";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PlatformDetectionResult = {
  /** Supported EarnSigma platform, or null when unrecognised / unsupported. */
  platform: UploadPlatform | null;
  /** 0–1 confidence score (informational only). */
  confidence: number;
  /** Human-readable platform name (may name an unsupported platform). */
  label: string;
  /** True when file matches a known-but-unsupported platform (Twitch, Ko-fi, …). */
  isKnownUnsupported: boolean;
  /** Set when isKnownUnsupported — friendly name for the unrecognised platform. */
  unsupportedName?: string;
};

export type PlatformExportLink = {
  /** Direct URL to the platform export page, if linkable. null for platforms needing app navigation. */
  exportUrl: string | null;
  /** Human-readable navigation path (shown as tooltip / help text). */
  navPath: string;
  /** Path to the platform logo asset. */
  logoPath: string;
  /** Display name. */
  label: string;
};

// ---------------------------------------------------------------------------
// Export deep-links
// ---------------------------------------------------------------------------

export const PLATFORM_EXPORT_LINKS: Record<string, PlatformExportLink> = {
  patreon: {
    exportUrl: "https://www.patreon.com/members",
    navPath: "Patreon → Audience → Members → Export CSV",
    logoPath: "/platforms/patreon.svg",
    label: "Patreon",
  },
  substack: {
    exportUrl: "https://substack.com/publish/subscribers",
    navPath: "Substack → Subscribers → Export",
    logoPath: "/platforms/substack.svg",
    label: "Substack",
  },
  youtube: {
    exportUrl: "https://studio.youtube.com",
    navPath: "YouTube Studio → Analytics → Advanced mode → Export → Download ZIP",
    logoPath: "/platforms/youtube.png",
    label: "YouTube",
  },
  instagram: {
    exportUrl: null,
    navPath: "Instagram → Settings → Accounts Center → Download your information → JSON format",
    logoPath: "/platforms/instagram.svg",
    label: "Instagram",
  },
  tiktok: {
    exportUrl: "https://www.tiktok.com/analytics",
    navPath: "TikTok Studio → Analytics → Download (Followers, Viewers, or Overview ZIP)",
    logoPath: "/platforms/tiktok.svg",
    label: "TikTok",
  },
};

// ---------------------------------------------------------------------------
// Tier 2: recognised-but-unsupported platform fingerprints
// ---------------------------------------------------------------------------

type UnsupportedSignature = {
  name: string;
  /** Normalised (lowercase, trimmed) header strings that fingerprint this platform. */
  headers: string[];
  /** Minimum fraction of headers that must match to trigger detection. */
  threshold: number;
};

const UNSUPPORTED_SIGNATURES: UnsupportedSignature[] = [
  {
    name: "Twitch",
    headers: ["stream date", "avg viewers", "followers gained", "max viewers", "hours streamed"],
    threshold: 0.6,
  },
  {
    name: "Ko-fi",
    headers: ["ko fi transaction id", "timestamp", "type", "from name", "amount", "net amount"],
    threshold: 0.6,
  },
  {
    name: "Gumroad",
    headers: ["sale id", "created at", "product name", "seller id", "price", "currency"],
    threshold: 0.6,
  },
  {
    name: "Beehiiv",
    headers: ["email", "status", "created", "referral code", "utm source"],
    threshold: 0.6,
  },
  {
    name: "Snapchat",
    headers: ["snap id", "story views", "reach", "impressions"],
    threshold: 0.75,
  },
];

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function normalizeH(raw: string): string {
  return raw
    .replace(/^\uFEFF/, "")
    .toLowerCase()
    .trim()
    .replace(/[_\-]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/[^a-z0-9 ]/g, "")
    .trim();
}

async function readCsvHeaders(file: File): Promise<string[]> {
  const slice = file.slice(0, 8192);
  const text = await slice.text();
  const firstLine = (text.split(/\r?\n/)[0] ?? "").trim();
  if (!firstLine) return [];

  const cells: string[] = [];
  let current = "";
  let inQuotes = false;
  for (const char of firstLine) {
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      cells.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  cells.push(current.trim());
  return cells.filter((h) => h.length > 0);
}

// ---------------------------------------------------------------------------
// Substack native subscriber export fingerprint
// ---------------------------------------------------------------------------
// Headers from the native Substack subscriber export CSV.
const SUBSTACK_SIGNATURE_HEADERS = [
  "email",
  "subscription type",
  "subscription started at",
  "paid at",
  "plan",
  "free subscription started at",
];
const SUBSTACK_MIN_MATCHES = 3;

// ---------------------------------------------------------------------------
// YouTube Studio "Table data.csv" fingerprint
// ---------------------------------------------------------------------------
// The ZIP contains Table data.csv with these columns.
const YOUTUBE_CSV_SIGNATURE_HEADERS = [
  "date",
  "views",
  "watch time hours",
  "subscribers",
  "estimated revenue usd",
];
const YOUTUBE_CSV_MIN_MATCHES = 3;
const YOUTUBE_CSV_REQUIRED_HEADER = "watch time hours";

// ---------------------------------------------------------------------------
// Main exported detection function
// ---------------------------------------------------------------------------

/**
 * Detect the EarnSigma platform from a user-dropped or user-selected file.
 *
 * Never throws. Errors are swallowed and return the "Unknown" result.
 */
export async function detectPlatformFromFile(file: File): Promise<PlatformDetectionResult> {
  const unknown: PlatformDetectionResult = {
    platform: null,
    confidence: 0,
    label: "Unknown",
    isKnownUnsupported: false,
  };

  try {
    const ext = (file.name.split(".").pop() ?? "").toLowerCase();

    // ── ZIP detection via existing zip-intake ────────────────────────────
    if (ext === "zip" || isZipUploadCandidate(file)) {
      try {
        const buf = await file.arrayBuffer();
        const result = inspectZipArchiveBuffer(buf, file);
        if (result.candidatePlatform) {
          const labelMap: Record<string, string> = {
            youtube: "YouTube",
            instagram: "Instagram",
            tiktok: "TikTok",
          };
          return {
            platform: result.candidatePlatform,
            confidence: 0.95,
            label: labelMap[result.candidatePlatform] ?? result.candidatePlatform,
            isKnownUnsupported: false,
          };
        }
      } catch {
        // Non-fatal – zip parsing can fail on malformed archives
      }
      return unknown;
    }

    // ── CSV detection ────────────────────────────────────────────────────
    if (ext === "csv" || file.type === "text/csv" || file.type === "") {
      let rawHeaders: string[];
      try {
        rawHeaders = await readCsvHeaders(file);
      } catch {
        return unknown;
      }

      const normalizedHeaders = rawHeaders.map(normalizeH);
      const headerSet = new Set(normalizedHeaders);

      // ── Patreon via existing high-quality detector ──
      const patreonResult = detectPatreonExportType(rawHeaders);
      if (
        patreonResult.detected_export_type === "patreon_members_export" &&
        patreonResult.confidence >= 0.45
      ) {
        return {
          platform: "patreon",
          confidence: patreonResult.confidence,
          label: "Patreon",
          isKnownUnsupported: false,
        };
      }

      // ── Substack native subscriber export ──
      const substackNorm = SUBSTACK_SIGNATURE_HEADERS.map(normalizeH);
      const substackMatches = substackNorm.filter((h) => headerSet.has(h)).length;
      if (substackMatches >= SUBSTACK_MIN_MATCHES) {
        return {
          platform: "substack",
          confidence: substackMatches / substackNorm.length,
          label: "Substack",
          isKnownUnsupported: false,
        };
      }

      // ── YouTube Studio Table data CSV ──
      const ytNorm = YOUTUBE_CSV_SIGNATURE_HEADERS.map(normalizeH);
      const ytMatches = ytNorm.filter((h) => headerSet.has(h)).length;
      if (ytMatches >= YOUTUBE_CSV_MIN_MATCHES && headerSet.has(normalizeH(YOUTUBE_CSV_REQUIRED_HEADER))) {
        return {
          platform: "youtube",
          confidence: ytMatches / ytNorm.length,
          label: "YouTube",
          isKnownUnsupported: false,
        };
      }

      // ── Tier 2: recognised-but-unsupported platforms ──
      for (const sig of UNSUPPORTED_SIGNATURES) {
        const sigNorm = sig.headers.map(normalizeH);
        const matches = sigNorm.filter((h) => headerSet.has(h)).length;
        const ratio = sigNorm.length > 0 ? matches / sigNorm.length : 0;
        if (ratio >= sig.threshold) {
          return {
            platform: null,
            confidence: ratio,
            label: sig.name,
            isKnownUnsupported: true,
            unsupportedName: sig.name,
          };
        }
      }

      return unknown;
    }

    return unknown;
  } catch {
    return unknown;
  }
}
