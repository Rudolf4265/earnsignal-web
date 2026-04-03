import type { UploadPlatform } from "@/src/lib/api/upload";
import type { PlatformRole, UploadPlatformCardMetadata } from "@/src/lib/upload/platform-metadata";

export type HelpPlatformAction =
  | {
      kind: "download";
      href: string;
      label: string;
      download?: string;
    }
  | {
      kind: "link";
      href: string;
      label: string;
    }
  | {
      kind: "close";
      label: string;
    };

export type HelpPlatformContent = {
  id: UploadPlatform;
  name: string;
  icon: string;
  summary: string;
  badge: "CSV template" | "Native export";
  reportRole: PlatformRole;
  reportRoleLabel: string;
  drawerTitle: string;
  intro: string;
  steps: string[];
  acceptedFile: string;
  acceptedFileNote?: string;
  beforeUpload: string[];
  commonMistakes: string[];
  primaryAction: HelpPlatformAction;
  secondaryAction: HelpPlatformAction;
};

type HelpPlatformOverride = Omit<HelpPlatformContent, "id" | "icon" | "name" | "reportRole" | "reportRoleLabel">;

const PLATFORM_ORDER: UploadPlatform[] = ["patreon", "substack", "youtube", "tiktok", "instagram"];

const HELP_PLATFORM_OVERRIDES: Record<UploadPlatform, HelpPlatformOverride> = {
  patreon: {
    summary: "Use the EarnSigma CSV template.",
    badge: "CSV template",
    drawerTitle: "How to prepare your Patreon file",
    intro: "Use the EarnSigma Patreon template. In Patreon, your source data lives under Audience and Insights.",
    steps: [
      "Download the EarnSigma Patreon template.",
      "In Patreon, open Audience from the left navigation.",
      "Open Insights if you need additional metrics.",
      "Copy the monthly values into the template.",
      "Save as CSV.",
      "Upload to EarnSigma.",
    ],
    acceptedFile: "CSV only — use the EarnSigma template.",
    beforeUpload: [
      "Keep header unchanged",
      "Save as CSV (not XLSX)",
      "Use numeric values only",
    ],
    commonMistakes: [
      "Uploading raw Patreon export",
      "Renaming columns",
      "Including currency symbols",
    ],
    primaryAction: {
      kind: "download",
      href: "/templates/earnsigma-patreon-template.csv",
      download: "earnsigma-patreon-template.csv",
      label: "Download Patreon template",
    },
    secondaryAction: {
      kind: "link",
      href: "/app/data",
      label: "Upload CSV",
    },
  },
  substack: {
    summary: "Use the EarnSigma CSV template.",
    badge: "CSV template",
    drawerTitle: "How to prepare your Substack file",
    intro: "Use the EarnSigma Substack template. Data is available under Audience → Growth.",
    steps: [
      "Download the template.",
      "Go to Audience.",
      "Open Growth.",
      "Select Unique visitors or New subscribers.",
      "Click Download CSV.",
      "Copy values into template.",
      "Save as CSV.",
      "Upload.",
    ],
    acceptedFile: "CSV only — use the EarnSigma template.",
    beforeUpload: [
      "Do not change headers",
      "CSV only",
      "Single dataset",
    ],
    commonMistakes: [
      "Uploading raw export",
      "Using XLSX",
      "Editing column names",
    ],
    primaryAction: {
      kind: "download",
      href: "/templates/earnsigma-substack-template.csv",
      download: "earnsigma-substack-template.csv",
      label: "Download Substack template",
    },
    secondaryAction: {
      kind: "link",
      href: "/app/data",
      label: "Upload CSV",
    },
  },
  youtube: {
    summary: "Upload your YouTube Studio export.",
    badge: "Native export",
    drawerTitle: "How to export your YouTube file",
    intro: "Upload your YouTube Studio export using Advanced mode.",
    steps: [
      "Open YouTube Studio.",
      "Go to Analytics.",
      "Click Advanced mode.",
      "Set date range.",
      "Choose Breakdown (Content, Audience, Date).",
      "Click export icon.",
      "Upload file to EarnSigma.",
    ],
    acceptedFile: "YouTube Studio export with:",
    acceptedFileNote: "Takeout not supported. Also supported today: EarnSigma normalized CSV template.",
    beforeUpload: [
      "Do not edit files",
      "Do not rename",
      "Do not use Takeout",
    ],
    commonMistakes: [
      "Using Google Takeout",
      "Exporting wrong view",
      "Editing files",
    ],
    primaryAction: {
      kind: "link",
      href: "/app/data",
      label: "Upload YouTube export",
    },
    secondaryAction: {
      kind: "close",
      label: "Back",
    },
  },
  tiktok: {
    summary: "Upload Overview, Viewers, or Followers export.",
    badge: "Native export",
    drawerTitle: "How to export your TikTok file",
    intro: "Upload Overview, Viewers, or Followers export from TikTok Studio.",
    steps: [
      "Open TikTok Studio.",
      "Go to Analytics.",
      "Choose Overview, Viewers, or Followers.",
      "Click Download data.",
      "Upload file.",
    ],
    acceptedFile: "Overview / Viewers / Followers only\nContent NOT supported",
    acceptedFileNote: "Also supported today: EarnSigma normalized CSV template.",
    beforeUpload: [
      "One file at a time",
      "No repackaging",
    ],
    commonMistakes: [
      "Using Content export",
      "Combining files",
      "Renaming",
    ],
    primaryAction: {
      kind: "link",
      href: "/app/data",
      label: "Upload TikTok export",
    },
    secondaryAction: {
      kind: "close",
      label: "Back",
    },
  },
  instagram: {
    summary: "Upload your Instagram export.",
    badge: "Native export",
    drawerTitle: "How to export your Instagram file",
    intro: "Use Instagram’s native export from Accounts Center.",
    steps: [
      "Open Settings.",
      "Click Accounts Center.",
      "Open Your information and permissions.",
      "Click Export your information.",
      "Download file.",
      "Upload to EarnSigma.",
    ],
    acceptedFile: "Instagram native export",
    acceptedFileNote: "Also supported today: EarnSigma normalized CSV template.",
    beforeUpload: [
      "Do not edit archive",
      "Upload original file",
    ],
    commonMistakes: [
      "Repacking archive",
      "Uploading screenshots",
    ],
    primaryAction: {
      kind: "link",
      href: "/app/data",
      label: "Upload Instagram export",
    },
    secondaryAction: {
      kind: "close",
      label: "Back",
    },
  },
};

function buildReportRoleLabel(reportRole: PlatformRole): string {
  return reportRole === "report-driving" ? "Can drive a report" : "Included in reports + Grow";
}

export function buildHelpPlatformContent(cards: UploadPlatformCardMetadata[]): HelpPlatformContent[] {
  const cardsById = new Map(cards.map((card) => [card.id, card]));

  return PLATFORM_ORDER.map((platformId) => {
    const card = cardsById.get(platformId);
    const override = HELP_PLATFORM_OVERRIDES[platformId];

    if (!card || !override) {
      throw new Error(`Missing help content for ${platformId}.`);
    }

    return {
      id: platformId,
      name: card.label,
      icon: card.icon,
      reportRole: card.platformRole,
      reportRoleLabel: buildReportRoleLabel(card.platformRole),
      ...override,
    };
  });
}
