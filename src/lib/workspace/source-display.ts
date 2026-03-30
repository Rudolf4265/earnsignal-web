import type { UploadPlatformCardMetadata } from "../upload/platform-metadata";
import type { UploadPlatform } from "../api/upload";
import type { WorkspaceDataSource } from "../api/workspace";

export type SourceListAction =
  | {
      kind: "upload";
      label: string;
      platform: UploadPlatform;
    }
  | {
      kind: "link";
      label: string;
      href: string;
    };

export type SourceListItem = {
  id: UploadPlatform;
  name: string;
  icon: string;
  status: PrimarySourceStatus;
  lastUpdatedLabel: string | null;
  issueLabel: string | null;
  primaryAction: SourceListAction;
  secondaryAction?: SourceListAction;
};

export type AdvancedSourceDetail = {
  id: UploadPlatform;
  name: string;
  includedInNextRun: boolean;
  sourceRole: "report_driving" | "optional_context";
  statusLabel: string;
  statusVariant: "good" | "warn" | "neutral";
  fileTypeLabel?: string;
  notes?: string;
  helpHref: string;
};

const SETTINGS_DATA_SOURCES_HREF = "/app/settings#data-sources";
const UPLOAD_GUIDE_HREF = "/app/help#upload-guide";

function formatLastUpdated(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) {
    return null;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(parsed));
}

export type PrimarySourceStatus = "connected" | "not_connected" | "fix_needed";

function resolvePrimaryStatus(source?: WorkspaceDataSource | null): PrimarySourceStatus {
  if (!source || source.state === "missing") {
    return "not_connected";
  }

  if (source.state === "failed") {
    return "fix_needed";
  }

  return "connected";
}

export function getPrimarySourceStatusLabel(status: PrimarySourceStatus): string {
  if (status === "connected") {
    return "Uploaded";
  }

  if (status === "fix_needed") {
    return "Fix needed";
  }

  return "Not connected";
}

export function getPrimarySourceStatusVariant(status: PrimarySourceStatus): "good" | "warn" | "neutral" {
  if (status === "connected") {
    return "good";
  }

  if (status === "fix_needed") {
    return "warn";
  }

  return "neutral";
}

function resolveLastUpdated(source?: WorkspaceDataSource | null): string | null {
  return formatLastUpdated(source?.lastReadyAt ?? source?.lastUploadAt ?? null);
}

function resolveIssueLabel(status: PrimarySourceStatus, source?: WorkspaceDataSource | null): string | null {
  if (status !== "fix_needed") {
    return null;
  }

  return source?.statusMessage?.trim() || "Upload failed";
}

function resolvePrimaryAction(card: UploadPlatformCardMetadata, source?: WorkspaceDataSource | null): SourceListAction {
  if (!source || source.state === "missing") {
    return {
      kind: "upload",
      label: "Connect",
      platform: card.id,
    };
  }

  if (source.state === "failed") {
    return {
      kind: "upload",
      label: "Retry",
      platform: card.id,
    };
  }

  if (source.state === "processing") {
    return {
      kind: "link",
      label: "View details",
      href: SETTINGS_DATA_SOURCES_HREF,
    };
  }

  return {
    kind: "upload",
    label: "Update",
    platform: card.id,
  };
}

function resolveSecondaryAction(): SourceListAction {
  return {
    kind: "link",
    label: "Details",
    href: SETTINGS_DATA_SOURCES_HREF,
  };
}

function resolveAdvancedStatus(source?: WorkspaceDataSource | null): {
  label: string;
  variant: "good" | "warn" | "neutral";
} {
  if (!source || source.state === "missing") {
    return {
      label: "Not connected",
      variant: "neutral",
    };
  }

  if (source.state === "failed") {
    return {
      label: "Fix needed",
      variant: "warn",
    };
  }

  if (source.state === "processing") {
    return {
      label: "Processing",
      variant: "neutral",
    };
  }

  return {
    label: "Uploaded",
    variant: "good",
  };
}

export function buildSourceListItems(
  cards: UploadPlatformCardMetadata[],
  sources: WorkspaceDataSource[] | null | undefined,
): SourceListItem[] {
  const sourceLookup = new Map((sources ?? []).map((source) => [source.platform, source]));

  return cards.map((card) => {
    const source = sourceLookup.get(card.id) ?? null;
    const status = resolvePrimaryStatus(source);
    const lastUpdatedLabel = resolveLastUpdated(source);

    return {
      id: card.id,
      name: source?.label || card.label,
      icon: card.icon,
      status,
      lastUpdatedLabel,
      issueLabel: resolveIssueLabel(status, source),
      primaryAction: resolvePrimaryAction(card, source),
      secondaryAction: resolveSecondaryAction(),
    };
  });
}

export function buildAdvancedSourceDetails(
  cards: UploadPlatformCardMetadata[],
  sources: WorkspaceDataSource[] | null | undefined,
): AdvancedSourceDetail[] {
  const sourceLookup = new Map((sources ?? []).map((source) => [source.platform, source]));

  return cards.map((card) => {
    const source = sourceLookup.get(card.id) ?? null;
    const status = resolveAdvancedStatus(source);

    return {
      id: card.id,
      name: source?.label || card.label,
      includedInNextRun: source?.includedInNextReport === true,
      sourceRole: source?.reportRole === "report_driving" || card.platformRole === "report-driving" ? "report_driving" : "optional_context",
      statusLabel: status.label,
      statusVariant: status.variant,
      fileTypeLabel: source?.acceptedFileTypesLabel || card.fileTypeLabel,
      notes: source?.statusMessage?.trim() || card.roleSummary || undefined,
      helpHref: UPLOAD_GUIDE_HREF,
    };
  });
}
