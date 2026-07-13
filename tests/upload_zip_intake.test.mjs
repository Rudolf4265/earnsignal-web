import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";

const zipIntakeModuleUrl = pathToFileURL(path.resolve("src/lib/upload/zip-intake.ts")).href;

const {
  inspectZipArchiveBuffer,
  inspectZipUploadFile,
  isZipUploadCandidate,
  toZipUploadRejection,
} = await import(`${zipIntakeModuleUrl}?t=${Date.now()}`);

const textEncoder = new TextEncoder();

function encodeUtf8(value) {
  return textEncoder.encode(value);
}

function pushUint16(bytes, value) {
  bytes.push(value & 0xff, (value >>> 8) & 0xff);
}

function pushUint32(bytes, value) {
  bytes.push(value & 0xff, (value >>> 8) & 0xff, (value >>> 16) & 0xff, (value >>> 24) & 0xff);
}

function concatUint8Arrays(chunks) {
  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const merged = new Uint8Array(totalLength);
  let offset = 0;

  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.length;
  }

  return merged;
}

function toArrayBuffer(bytes) {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
}

function createSyntheticZip(entries) {
  const localChunks = [];
  const centralChunks = [];
  let localOffset = 0;

  for (const entry of entries) {
    const nameBytes = encodeUtf8(entry.name);
    const dataBytes = entry.data ? encodeUtf8(entry.data) : new Uint8Array();
    const flags = entry.flags ?? 0;
    const compressionMethod = entry.compressionMethod ?? 0;

    const localHeader = [];
    pushUint32(localHeader, 0x04034b50);
    pushUint16(localHeader, 20);
    pushUint16(localHeader, flags);
    pushUint16(localHeader, compressionMethod);
    pushUint16(localHeader, 0);
    pushUint16(localHeader, 0);
    pushUint32(localHeader, 0);
    pushUint32(localHeader, dataBytes.length);
    pushUint32(localHeader, dataBytes.length);
    pushUint16(localHeader, nameBytes.length);
    pushUint16(localHeader, 0);

    const localChunk = concatUint8Arrays([Uint8Array.from(localHeader), nameBytes, dataBytes]);
    localChunks.push(localChunk);

    const centralHeader = [];
    pushUint32(centralHeader, 0x02014b50);
    pushUint16(centralHeader, 20);
    pushUint16(centralHeader, 20);
    pushUint16(centralHeader, flags);
    pushUint16(centralHeader, compressionMethod);
    pushUint16(centralHeader, 0);
    pushUint16(centralHeader, 0);
    pushUint32(centralHeader, 0);
    pushUint32(centralHeader, dataBytes.length);
    pushUint32(centralHeader, dataBytes.length);
    pushUint16(centralHeader, nameBytes.length);
    pushUint16(centralHeader, 0);
    pushUint16(centralHeader, 0);
    pushUint16(centralHeader, 0);
    pushUint16(centralHeader, 0);
    pushUint32(centralHeader, entry.name.endsWith("/") ? 0x10 : 0);
    pushUint32(centralHeader, localOffset);

    const centralChunk = concatUint8Arrays([Uint8Array.from(centralHeader), nameBytes]);
    centralChunks.push(centralChunk);
    localOffset += localChunk.length;
  }

  const centralDirectory = concatUint8Arrays(centralChunks);
  const eocd = [];
  pushUint32(eocd, 0x06054b50);
  pushUint16(eocd, 0);
  pushUint16(eocd, 0);
  pushUint16(eocd, entries.length);
  pushUint16(eocd, entries.length);
  pushUint32(eocd, centralDirectory.length);
  pushUint32(eocd, localOffset);
  pushUint16(eocd, 0);

  return toArrayBuffer(concatUint8Arrays([...localChunks, centralDirectory, Uint8Array.from(eocd)]));
}

test("isZipUploadCandidate only flags zip-like names or mime types", () => {
  assert.equal(isZipUploadCandidate({ name: "instagram-export.zip", type: "application/zip" }), true);
  assert.equal(isZipUploadCandidate({ name: "monthly.csv", type: "text/csv" }), false);
});

test("inspectZipArchiveBuffer rejects non-zip buffers", () => {
  const buffer = toArrayBuffer(encodeUtf8("month,revenue\n2026-01,10\n"));
  const result = inspectZipArchiveBuffer(buffer, { name: "monthly.csv", size: buffer.byteLength });

  assert.equal(result.kind, "not_zip");
  assert.equal(result.reasonCode, "not_zip");
});

test("inspectZipArchiveBuffer rejects corrupt zip buffers", () => {
  const corrupt = toArrayBuffer(Uint8Array.from([0x50, 0x4b, 0x03, 0x04, 0x00, 0x00, 0x00]));
  const result = inspectZipArchiveBuffer(corrupt, { name: "broken.zip", size: corrupt.byteLength });

  assert.equal(result.kind, "invalid_archive");
  assert.equal(result.reasonCode, "corrupt_archive");
});

test("inspectZipArchiveBuffer rejects unsafe traversal paths", () => {
  const archive = createSyntheticZip([{ name: "../escape.txt" }]);
  const result = inspectZipArchiveBuffer(archive, { name: "unsafe.zip", size: archive.byteLength });

  assert.equal(result.kind, "security_rejected");
  assert.equal(result.reasonCode, "unsafe_archive_path");
});

test("inspectZipArchiveBuffer rejects suspicious absolute paths", () => {
  const archive = createSyntheticZip([{ name: "/absolute/path.txt" }]);
  const result = inspectZipArchiveBuffer(archive, { name: "unsafe.zip", size: archive.byteLength });

  assert.equal(result.kind, "security_rejected");
  assert.equal(result.reasonCode, "unsafe_archive_path");
});

test("inspectZipArchiveBuffer rejects encrypted entries", () => {
  const archive = createSyntheticZip([{ name: "content/posts_1.json", flags: 0x0001 }]);
  const result = inspectZipArchiveBuffer(archive, { name: "encrypted.zip", size: archive.byteLength });

  assert.equal(result.kind, "invalid_archive");
  assert.equal(result.reasonCode, "encrypted_or_unreadable_archive");
});

test("inspectZipArchiveBuffer rejects bounded oversize and entry-count violations", () => {
  const archive = createSyntheticZip([{ name: "one.txt" }, { name: "two.txt" }, { name: "three.txt" }]);
  const tooManyEntries = inspectZipArchiveBuffer(archive, { name: "crowded.zip", size: archive.byteLength }, { maxEntries: 2 });
  const tooLarge = inspectZipArchiveBuffer(archive, { name: "large.zip", size: archive.byteLength }, { maxBytes: 4 });

  assert.equal(tooManyEntries.kind, "security_rejected");
  assert.equal(tooManyEntries.reasonCode, "too_many_entries");
  assert.equal(tooLarge.kind, "security_rejected");
  assert.equal(tooLarge.reasonCode, "archive_too_large");
});

test("inspectZipArchiveBuffer classifies native instagram export shapes", () => {
  const archive = createSyntheticZip([
    { name: "content/posts_1.json" },
    { name: "connections/followers_1.json" },
  ]);
  const result = inspectZipArchiveBuffer(archive, { name: "instagram.zip", size: archive.byteLength });

  assert.equal(result.kind, "supported_shape_instagram_native_zip");
  assert.equal(result.candidatePlatform, "instagram");
  assert.equal(result.reasonCode, null);
  assert.deepEqual(result.matchedPatterns.sort(), ["path:connections/"]);
});

test("inspectZipArchiveBuffer no longer classifies retired instagram csv-in-zip shapes as supported", () => {
  const archive = createSyntheticZip([{ name: "content/instagram_content_export.csv" }]);
  const result = inspectZipArchiveBuffer(archive, { name: "instagram.zip", size: archive.byteLength });

  assert.equal(result.kind, "unsupported_archive");
  assert.equal(result.reasonCode, "unsupported_archive_shape");
});

test("inspectZipArchiveBuffer classifies native tiktok analytics export shapes", () => {
  const overviewArchive = createSyntheticZip([{ name: "Overview.csv" }]);
  const followersArchive = createSyntheticZip([
    { name: "FollowerHistory.csv" },
    { name: "FollowerGender.csv" },
    { name: "FollowerTopTerritories.csv" },
    { name: "FollowerActivity.csv" },
  ]);

  const overview = inspectZipArchiveBuffer(overviewArchive, { name: "tiktok-overview.zip", size: overviewArchive.byteLength });
  const followers = inspectZipArchiveBuffer(followersArchive, { name: "tiktok-followers.zip", size: followersArchive.byteLength });

  assert.equal(overview.kind, "supported_shape_tiktok_native_zip");
  assert.equal(overview.candidatePlatform, "tiktok");
  assert.equal(overview.reasonCode, null);
  assert.deepEqual(overview.matchedPatterns, ["shape:overview_export_zip"]);
  assert.equal(followers.kind, "supported_shape_tiktok_native_zip");
  assert.equal(followers.candidatePlatform, "tiktok");
  assert.deepEqual(followers.matchedPatterns, ["shape:followers_export_zip"]);
});

test("inspectZipArchiveBuffer no longer classifies retired tiktok csv-in-zip shapes as supported", () => {
  const archive = createSyntheticZip([{ name: "tiktok data/tiktok_performance_export.csv" }]);
  const result = inspectZipArchiveBuffer(archive, { name: "tiktok.zip", size: archive.byteLength });

  assert.equal(result.kind, "unsupported_archive");
  assert.equal(result.reasonCode, "unsupported_archive_shape");
});

test("inspectZipArchiveBuffer rejects unsupported archive shapes deterministically", () => {
  const unsupportedArchive = createSyntheticZip([{ name: "notes/readme.txt" }]);
  const tiktokContentArchive = createSyntheticZip([{ name: "Content.csv" }]);
  const takeoutArchive = createSyntheticZip([{ name: "Takeout/YouTube and YouTube Music/history/watch-history.json" }]);
  const mixedLegacyArchive = createSyntheticZip([
    { name: "content/posts_1.json" },
    { name: "connections/followers_1.json" },
    { name: "tiktok data/profile/User Info.txt" },
    { name: "tiktok data/activity/Like List.txt" },
  ]);

  const unsupported = inspectZipArchiveBuffer(unsupportedArchive, { name: "random.zip", size: unsupportedArchive.byteLength });
  const tiktokContent = inspectZipArchiveBuffer(tiktokContentArchive, { name: "tiktok-content.zip", size: tiktokContentArchive.byteLength });
  const takeout = inspectZipArchiveBuffer(takeoutArchive, { name: "takeout.zip", size: takeoutArchive.byteLength });
  const mixedLegacy = inspectZipArchiveBuffer(mixedLegacyArchive, { name: "mixed.zip", size: mixedLegacyArchive.byteLength });

  assert.equal(unsupported.kind, "unsupported_archive");
  assert.equal(unsupported.reasonCode, "unsupported_archive_shape");
  assert.equal(tiktokContent.kind, "unsupported_archive");
  assert.equal(tiktokContent.reasonCode, "tiktok_content_export_not_supported");
  assert.equal(takeout.kind, "unsupported_archive");
  assert.equal(takeout.reasonCode, "youtube_takeout_not_supported");
  // TikTok native detection requires exact entry sets, so mixed legacy archives
  // resolve deterministically to the instagram native shape instead of ambiguity.
  assert.equal(mixedLegacy.kind, "supported_shape_instagram_native_zip");
  assert.equal(mixedLegacy.reasonCode, null);
});

test("inspectZipUploadFile passes native zips through and rejection mapping only fires for rejected shapes", async () => {
  const nativeArchive = createSyntheticZip([
    { name: "content/posts_1.json" },
    { name: "connections/followers_1.json" },
  ]);
  const unsupportedArchive = createSyntheticZip([{ name: "notes/readme.txt" }]);

  const nativeResult = await inspectZipUploadFile({
    name: "instagram.zip",
    type: "application/zip",
    size: nativeArchive.byteLength,
    async arrayBuffer() {
      return nativeArchive;
    },
  });
  const unsupportedResult = await inspectZipUploadFile({
    name: "random.zip",
    type: "application/zip",
    size: unsupportedArchive.byteLength,
    async arrayBuffer() {
      return unsupportedArchive;
    },
  });

  // Native export ZIPs are the supported ingestion path now: no rejection is produced
  // and the raw archive passes through to the backend.
  assert.equal(nativeResult.kind, "supported_shape_instagram_native_zip");
  assert.equal(toZipUploadRejection(nativeResult), null);

  const rejection = toZipUploadRejection(unsupportedResult);
  assert.equal(unsupportedResult.kind, "unsupported_archive");
  assert.equal(rejection?.reasonCode, "unsupported_archive_shape");
});
