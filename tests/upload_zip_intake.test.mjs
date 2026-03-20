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

test("inspectZipArchiveBuffer classifies bounded instagram candidate shapes", () => {
  const archive = createSyntheticZip([
    { name: "content/posts_1.json" },
    { name: "connections/followers_1.json" },
  ]);
  const result = inspectZipArchiveBuffer(archive, { name: "instagram.zip", size: archive.byteLength });

  assert.equal(result.kind, "supported_shape_instagram_candidate");
  assert.equal(result.candidatePlatform, "instagram");
  assert.equal(result.reasonCode, null);
  assert.deepEqual(
    result.matchedPatterns.sort(),
    ["file:followers_1.json", "file:posts_1.json", "path:connections/", "path:content/"],
  );
});

test("inspectZipArchiveBuffer classifies bounded tiktok candidate shapes", () => {
  const archive = createSyntheticZip([
    { name: "tiktok data/profile/User Info.txt" },
    { name: "tiktok data/activity/Like List.txt" },
  ]);
  const result = inspectZipArchiveBuffer(archive, { name: "tiktok.zip", size: archive.byteLength });

  assert.equal(result.kind, "supported_shape_tiktok_candidate");
  assert.equal(result.candidatePlatform, "tiktok");
  assert.equal(result.reasonCode, null);
});

test("inspectZipArchiveBuffer rejects unsupported and ambiguous archive shapes deterministically", () => {
  const unsupportedArchive = createSyntheticZip([{ name: "notes/readme.txt" }]);
  const ambiguousArchive = createSyntheticZip([
    { name: "content/posts_1.json" },
    { name: "connections/followers_1.json" },
    { name: "tiktok data/profile/User Info.txt" },
    { name: "tiktok data/activity/Like List.txt" },
  ]);

  const unsupported = inspectZipArchiveBuffer(unsupportedArchive, { name: "random.zip", size: unsupportedArchive.byteLength });
  const ambiguous = inspectZipArchiveBuffer(ambiguousArchive, { name: "mixed.zip", size: ambiguousArchive.byteLength });

  assert.equal(unsupported.kind, "unsupported_archive");
  assert.equal(unsupported.reasonCode, "unsupported_archive_shape");
  assert.equal(ambiguous.kind, "ambiguous_archive");
  assert.equal(ambiguous.reasonCode, "ambiguous_archive_shape");
});

test("inspectZipUploadFile and rejection mapping keep candidate zips out of the ingestion-success path", async () => {
  const archive = createSyntheticZip([
    { name: "content/posts_1.json" },
    { name: "connections/followers_1.json" },
  ]);

  const result = await inspectZipUploadFile({
    name: "instagram.zip",
    type: "application/zip",
    size: archive.byteLength,
    async arrayBuffer() {
      return archive;
    },
  });
  const rejection = toZipUploadRejection(result);

  assert.equal(result.kind, "supported_shape_instagram_candidate");
  assert.deepEqual(rejection, {
    reasonCode: "zip_not_importable",
    message: "This ZIP format is not yet importable. Upload a supported CSV instead.",
  });
  assert.equal(rejection.message.includes("Instagram"), false);
  assert.equal(rejection.message.includes("TikTok"), false);
});
