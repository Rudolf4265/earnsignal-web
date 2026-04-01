export type ZipArchiveClassificationKind =
  | "not_zip"
  | "invalid_archive"
  | "unsupported_archive"
  | "supported_shape_tiktok_native_zip"
  | "supported_shape_instagram_native_zip"
  | "supported_shape_youtube_studio_zip"
  | "ambiguous_archive"
  | "security_rejected";

export type ZipArchiveReasonCode =
  | "not_zip"
  | "corrupt_archive"
  | "encrypted_or_unreadable_archive"
  | "unsafe_archive_path"
  | "unsupported_archive_shape"
  | "tiktok_content_export_not_supported"
  | "youtube_takeout_not_supported"
  | "too_many_entries"
  | "archive_too_large"
  | "ambiguous_archive_shape";

export type ZipCandidatePlatform = "instagram" | "tiktok" | "youtube" | null;

export type ZipArchiveEntry = {
  rawName: string;
  normalizedPath: string;
  localHeaderOffset: number;
  compressedSize: number;
  uncompressedSize: number;
  compressionMethod: number;
  encrypted: boolean;
  isDirectory: boolean;
};

export type ZipArchiveInspectionResult = {
  kind: ZipArchiveClassificationKind;
  reasonCode: ZipArchiveReasonCode | null;
  message: string;
  candidatePlatform: ZipCandidatePlatform;
  entryCount: number;
  matchedPatterns: string[];
  entries: ZipArchiveEntry[];
};

export type ZipUploadFileLike = {
  name?: string | null;
  type?: string | null;
  size?: number | null;
  arrayBuffer(): Promise<ArrayBuffer>;
};

export type ZipUploadRejection = {
  reasonCode: string;
  message: string;
};

export type ZipIntakeOptions = {
  maxBytes: number;
  maxEntries: number;
  maxFilenameBytes: number;
};

export const DEFAULT_ZIP_INTAKE_OPTIONS: ZipIntakeOptions = {
  maxBytes: 32 * 1024 * 1024,
  maxEntries: 256,
  maxFilenameBytes: 1024,
};

const EOCD_SIGNATURE = 0x06054b50;
const CENTRAL_DIRECTORY_SIGNATURE = 0x02014b50;
const LOCAL_FILE_HEADER_SIGNATURE = 0x04034b50;
const EMPTY_ARCHIVE_SIGNATURE = 0x06054b50;
const SPANNED_ARCHIVE_SIGNATURE = 0x08074b50;
const ZIP_MAGIC_SIGNATURES = new Set([LOCAL_FILE_HEADER_SIGNATURE, EMPTY_ARCHIVE_SIGNATURE, SPANNED_ARCHIVE_SIGNATURE]);
const ENCRYPTED_ENTRY_FLAG = 0x0001;

// TikTok native ZIP shapes — exact entry sets that the backend accepts.
// Content ZIP is explicitly not supported.
const TIKTOK_FOLLOWERS_ZIP_ENTRIES = new Set([
  "followerhistory.csv",
  "followergender.csv",
  "followertopterritories.csv",
  "followeractivity.csv",
]);
const TIKTOK_VIEWERS_ZIP_ENTRIES = new Set(["viewers.csv"]);
const TIKTOK_OVERVIEW_ZIP_ENTRIES = new Set(["overview.csv"]);
const TIKTOK_CONTENT_ZIP_ENTRIES = new Set(["content.csv"]);

// YouTube Studio ZIP — all three files must be present.
const YOUTUBE_STUDIO_ZIP_REQUIRED = new Set([
  "table data.csv",
  "chart data.csv",
  "totals.csv",
]);
// Google Takeout ZIP sentinel path.
const YOUTUBE_TAKEOUT_PATH_MARKER = "takeout/youtube";

// Instagram native ZIP — require path prefixes from connections/ or logged_information/.
const INSTAGRAM_NATIVE_PATH_PREFIXES = [
  "connections/",
  "logged_information/",
] as const;

const textDecoder = new TextDecoder("utf-8");

function readUint16(view: DataView, offset: number): number {
  return view.getUint16(offset, true);
}

function readUint32(view: DataView, offset: number): number {
  return view.getUint32(offset, true);
}

function createResult(
  kind: ZipArchiveClassificationKind,
  reasonCode: ZipArchiveReasonCode | null,
  message: string,
  options?: Partial<Pick<ZipArchiveInspectionResult, "candidatePlatform" | "entryCount" | "matchedPatterns" | "entries">>,
): ZipArchiveInspectionResult {
  return {
    kind,
    reasonCode,
    message,
    candidatePlatform: options?.candidatePlatform ?? null,
    entryCount: options?.entryCount ?? 0,
    matchedPatterns: options?.matchedPatterns ?? [],
    entries: options?.entries ?? [],
  };
}

function resolveOptions(options?: Partial<ZipIntakeOptions>): ZipIntakeOptions {
  return {
    maxBytes: options?.maxBytes ?? DEFAULT_ZIP_INTAKE_OPTIONS.maxBytes,
    maxEntries: options?.maxEntries ?? DEFAULT_ZIP_INTAKE_OPTIONS.maxEntries,
    maxFilenameBytes: options?.maxFilenameBytes ?? DEFAULT_ZIP_INTAKE_OPTIONS.maxFilenameBytes,
  };
}

function normalizeZipCandidateString(value: string | null | undefined): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export function isZipUploadCandidate(fileLike: Pick<ZipUploadFileLike, "name" | "type">): boolean {
  const name = normalizeZipCandidateString(fileLike.name);
  const type = normalizeZipCandidateString(fileLike.type);

  return name.endsWith(".zip") || type.includes("zip");
}

function looksLikeZipData(bytes: Uint8Array): boolean {
  if (bytes.length < 4) {
    return false;
  }

  const signature = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(0, true);
  return ZIP_MAGIC_SIGNATURES.has(signature);
}

function hasRange(bytes: Uint8Array, offset: number, length: number): boolean {
  return offset >= 0 && length >= 0 && offset + length <= bytes.byteLength;
}

function findEndOfCentralDirectory(bytes: Uint8Array, view: DataView): number {
  const minimumLength = 22;
  if (bytes.byteLength < minimumLength) {
    return -1;
  }

  const minOffset = Math.max(0, bytes.byteLength - 0xffff - minimumLength);
  for (let offset = bytes.byteLength - minimumLength; offset >= minOffset; offset -= 1) {
    if (readUint32(view, offset) === EOCD_SIGNATURE) {
      return offset;
    }
  }

  return -1;
}

function normalizeArchiveEntryPath(rawName: string): { ok: true; normalizedPath: string } | { ok: false } {
  const normalizedSlashes = rawName.replace(/\\/g, "/").trim();
  if (!normalizedSlashes || normalizedSlashes.includes("\0")) {
    return { ok: false };
  }

  if (normalizedSlashes.startsWith("/") || normalizedSlashes.startsWith("//") || /^[a-zA-Z]:\//.test(normalizedSlashes)) {
    return { ok: false };
  }

  const segments = normalizedSlashes.split("/").filter((segment) => segment.length > 0 && segment !== ".");
  if (segments.length === 0 || segments.some((segment) => segment === "..")) {
    return { ok: false };
  }

  return { ok: true, normalizedPath: segments.join("/") };
}

function collectMatchingPatterns(paths: readonly string[], prefixes: readonly string[], basenames: readonly string[]): string[] {
  const pathMatches = prefixes.filter((prefix) => paths.some((path) => path.startsWith(prefix))).map((prefix) => `path:${prefix}`);
  const basenameMatches = basenames
    .filter((basename) => paths.some((path) => path.endsWith(`/${basename}`) || path === basename))
    .map((basename) => `file:${basename}`);

  return [...pathMatches, ...basenameMatches];
}

function collectExactPathMatches(paths: readonly string[], allowlistedPaths: readonly string[]): string[] {
  return allowlistedPaths.filter((candidatePath) => paths.includes(candidatePath)).map((candidatePath) => `file:${candidatePath}`);
}

function setsEqual(a: Set<string>, b: Set<string>): boolean {
  if (a.size !== b.size) return false;
  for (const item of a) if (!b.has(item)) return false;
  return true;
}

function classifyArchiveShape(entries: ZipArchiveEntry[]): ZipArchiveInspectionResult {
  const fileEntries = entries.filter((entry) => !entry.isDirectory);
  const filePaths = fileEntries.map((entry) => entry.normalizedPath.toLowerCase());
  const fileNameSet = new Set(filePaths.map((p) => p.split("/").pop() ?? p));

  // ── YouTube Studio ZIP ─────────────────────────────────────────────────────
  const studioMatches = [...YOUTUBE_STUDIO_ZIP_REQUIRED].filter((f) => fileNameSet.has(f));
  if (setsEqual(YOUTUBE_STUDIO_ZIP_REQUIRED, new Set(studioMatches))) {
    return createResult(
      "supported_shape_youtube_studio_zip",
      null,
      "ZIP archive matches the YouTube Studio content analytics export shape.",
      { candidatePlatform: "youtube", entryCount: entries.length, matchedPatterns: studioMatches.map((f) => `file:${f}`), entries },
    );
  }

  // Google Takeout ZIP — detected and explicitly rejected for youtube.
  if (filePaths.some((p) => p.startsWith(YOUTUBE_TAKEOUT_PATH_MARKER))) {
    return createResult(
      "unsupported_archive",
      "youtube_takeout_not_supported",
      "Google Takeout ZIPs are not supported. Export from YouTube Studio → Analytics → Advanced mode → Export instead.",
      { candidatePlatform: "youtube", entryCount: entries.length, entries },
    );
  }

  // ── TikTok native ZIPs — exact entry-set match ─────────────────────────────
  const isTikTokFollowers = setsEqual(TIKTOK_FOLLOWERS_ZIP_ENTRIES, fileNameSet);
  const isTikTokViewers = setsEqual(TIKTOK_VIEWERS_ZIP_ENTRIES, fileNameSet);
  const isTikTokOverview = setsEqual(TIKTOK_OVERVIEW_ZIP_ENTRIES, fileNameSet);
  const isTikTokContent = setsEqual(TIKTOK_CONTENT_ZIP_ENTRIES, fileNameSet);

  if (isTikTokFollowers || isTikTokViewers || isTikTokOverview) {
    const shapeId = isTikTokFollowers ? "followers_export_zip" : isTikTokViewers ? "viewers_export_zip" : "overview_export_zip";
    return createResult(
      "supported_shape_tiktok_native_zip",
      null,
      "ZIP archive matches a supported TikTok native export shape.",
      { candidatePlatform: "tiktok", entryCount: entries.length, matchedPatterns: [`shape:${shapeId}`], entries },
    );
  }

  // TikTok Content ZIP — detected and explicitly rejected.
  if (isTikTokContent) {
    return createResult(
      "unsupported_archive",
      "tiktok_content_export_not_supported",
      "The TikTok Content ZIP is not supported. Upload the Followers, Viewers, or Overview ZIP instead.",
      { candidatePlatform: "tiktok", entryCount: entries.length, entries },
    );
  }

  // ── Instagram native ZIP — path-prefix detection ───────────────────────────
  const instagramPrefixCount = INSTAGRAM_NATIVE_PATH_PREFIXES.filter(
    (prefix) => filePaths.some((p) => p.startsWith(prefix)),
  ).length;
  if (instagramPrefixCount >= 1) {
    return createResult(
      "supported_shape_instagram_native_zip",
      null,
      "ZIP archive matches the Instagram native export shape.",
      {
        candidatePlatform: "instagram",
        entryCount: entries.length,
        matchedPatterns: INSTAGRAM_NATIVE_PATH_PREFIXES.filter((prefix) => filePaths.some((p) => p.startsWith(prefix))).map((prefix) => `path:${prefix}`),
        entries,
      },
    );
  }

  return createResult(
    "unsupported_archive",
    "unsupported_archive_shape",
    "ZIP archive does not match a supported allowlisted archive shape.",
    { entryCount: entries.length, entries },
  );
}

export function inspectZipArchiveBuffer(
  buffer: ArrayBuffer,
  metadata?: Pick<ZipUploadFileLike, "name" | "type" | "size">,
  options?: Partial<ZipIntakeOptions>,
): ZipArchiveInspectionResult {
  const resolvedOptions = resolveOptions(options);
  const archiveSize = metadata?.size ?? buffer.byteLength;
  if (archiveSize > resolvedOptions.maxBytes) {
    return createResult(
      "security_rejected",
      "archive_too_large",
      `ZIP archive exceeds the bounded size limit of ${resolvedOptions.maxBytes} bytes.`,
    );
  }

  const bytes = new Uint8Array(buffer);
  if (!looksLikeZipData(bytes)) {
    return createResult("not_zip", "not_zip", "File does not appear to be a ZIP archive.");
  }

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const eocdOffset = findEndOfCentralDirectory(bytes, view);
  if (eocdOffset < 0 || !hasRange(bytes, eocdOffset, 22)) {
    return createResult("invalid_archive", "corrupt_archive", "ZIP archive could not be read.");
  }

  const totalEntries = readUint16(view, eocdOffset + 10);
  const centralDirectorySize = readUint32(view, eocdOffset + 12);
  const centralDirectoryOffset = readUint32(view, eocdOffset + 16);

  if (totalEntries === 0) {
    return createResult("unsupported_archive", "unsupported_archive_shape", "ZIP archive contains no entries.");
  }

  if (totalEntries > resolvedOptions.maxEntries) {
    return createResult(
      "security_rejected",
      "too_many_entries",
      `ZIP archive contains more than ${resolvedOptions.maxEntries} entries.`,
    );
  }

  if (!hasRange(bytes, centralDirectoryOffset, centralDirectorySize)) {
    return createResult("invalid_archive", "corrupt_archive", "ZIP archive central directory is malformed.");
  }

  const entries: ZipArchiveEntry[] = [];
  let offset = centralDirectoryOffset;

  for (let index = 0; index < totalEntries; index += 1) {
    if (!hasRange(bytes, offset, 46) || readUint32(view, offset) !== CENTRAL_DIRECTORY_SIGNATURE) {
      return createResult("invalid_archive", "corrupt_archive", "ZIP archive central directory entry is malformed.");
    }

    const flags = readUint16(view, offset + 8);
    const compressionMethod = readUint16(view, offset + 10);
    const compressedSize = readUint32(view, offset + 20);
    const uncompressedSize = readUint32(view, offset + 24);
    const fileNameLength = readUint16(view, offset + 28);
    const extraLength = readUint16(view, offset + 30);
    const commentLength = readUint16(view, offset + 32);
    const totalHeaderLength = 46 + fileNameLength + extraLength + commentLength;

    if (fileNameLength === 0 || fileNameLength > resolvedOptions.maxFilenameBytes || !hasRange(bytes, offset, totalHeaderLength)) {
      return createResult("invalid_archive", "corrupt_archive", "ZIP archive entry name is malformed.");
    }

    if ((flags & ENCRYPTED_ENTRY_FLAG) !== 0) {
      return createResult(
        "invalid_archive",
        "encrypted_or_unreadable_archive",
        "Encrypted ZIP archives are not accepted by the bounded intake layer.",
      );
    }

    const nameBytes = bytes.subarray(offset + 46, offset + 46 + fileNameLength);
    const rawName = textDecoder.decode(nameBytes);
    const normalizedPathResult = normalizeArchiveEntryPath(rawName);
    if (!normalizedPathResult.ok) {
      return createResult(
        "security_rejected",
        "unsafe_archive_path",
        "ZIP archive contains an unsafe entry path and was rejected.",
      );
    }

    entries.push({
      rawName,
      normalizedPath: normalizedPathResult.normalizedPath,
      localHeaderOffset: readUint32(view, offset + 42),
      compressedSize,
      uncompressedSize,
      compressionMethod,
      encrypted: false,
      isDirectory: rawName.endsWith("/") || rawName.endsWith("\\"),
    });

    offset += totalHeaderLength;
  }

  return classifyArchiveShape(entries);
}

export async function inspectZipUploadFile(
  file: ZipUploadFileLike,
  options?: Partial<ZipIntakeOptions>,
): Promise<ZipArchiveInspectionResult> {
  const resolvedOptions = resolveOptions(options);

  if ((file.size ?? 0) > resolvedOptions.maxBytes) {
    return createResult(
      "security_rejected",
      "archive_too_large",
      `ZIP archive exceeds the bounded size limit of ${resolvedOptions.maxBytes} bytes.`,
    );
  }

  const buffer = await file.arrayBuffer();
  return inspectZipArchiveBuffer(buffer, file, options);
}

function assertReadableLocalFileHeader(bytes: Uint8Array, view: DataView, entry: ZipArchiveEntry): { dataOffset: number } {
  if (!hasRange(bytes, entry.localHeaderOffset, 30) || readUint32(view, entry.localHeaderOffset) !== LOCAL_FILE_HEADER_SIGNATURE) {
    throw new Error("ZIP archive local file header is malformed.");
  }

  const fileNameLength = readUint16(view, entry.localHeaderOffset + 26);
  const extraLength = readUint16(view, entry.localHeaderOffset + 28);
  const dataOffset = entry.localHeaderOffset + 30 + fileNameLength + extraLength;

  if (!hasRange(bytes, dataOffset, entry.compressedSize)) {
    throw new Error("ZIP archive entry data is malformed.");
  }

  return { dataOffset };
}

async function inflateDeflateRaw(bytes: Uint8Array): Promise<Uint8Array> {
  const blobBytes = Uint8Array.from(bytes);
  const stream = new Blob([blobBytes.buffer]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
  const buffer = await new Response(stream).arrayBuffer();
  return new Uint8Array(buffer);
}

export async function extractZipArchiveEntryBytes(buffer: ArrayBuffer, entry: ZipArchiveEntry): Promise<Uint8Array> {
  const bytes = new Uint8Array(buffer);
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const { dataOffset } = assertReadableLocalFileHeader(bytes, view, entry);
  const compressedBytes = bytes.slice(dataOffset, dataOffset + entry.compressedSize);

  if (entry.compressionMethod === 0) {
    return compressedBytes;
  }

  if (entry.compressionMethod === 8) {
    return inflateDeflateRaw(compressedBytes);
  }

  throw new Error(`Unsupported ZIP compression method: ${entry.compressionMethod}`);
}

export async function extractZipArchiveEntryText(buffer: ArrayBuffer, entry: ZipArchiveEntry): Promise<string> {
  const entryBytes = await extractZipArchiveEntryBytes(buffer, entry);
  return textDecoder.decode(entryBytes);
}

export function toZipUploadRejection(result: ZipArchiveInspectionResult): ZipUploadRejection | null {
  if (result.kind === "not_zip") {
    return {
      reasonCode: "not_zip",
      message: "We couldn’t read that ZIP file. Upload a supported CSV instead.",
    };
  }

  if (result.reasonCode === "tiktok_content_export_not_supported") {
    return {
      reasonCode: "tiktok_content_export_not_supported",
      message: "The TikTok Content ZIP is not supported. Upload the Followers, Viewers, or Overview ZIP instead.",
    };
  }

  if (result.reasonCode === "youtube_takeout_not_supported") {
    return {
      reasonCode: "youtube_takeout_not_supported",
      message: "Google Takeout ZIPs are not supported. Export from YouTube Studio → Analytics → Advanced mode → Export instead.",
    };
  }

  if (!result.reasonCode) {
    return null;
  }

  return {
    reasonCode: result.reasonCode,
    message: result.message,
  };
}
