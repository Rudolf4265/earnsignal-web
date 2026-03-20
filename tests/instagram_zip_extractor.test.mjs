import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { deflateRawSync } from "node:zlib";

const extractorModuleUrl = pathToFileURL(path.resolve("src/lib/upload/instagram-zip-extractor.ts")).href;
const zipIntakeModuleUrl = pathToFileURL(path.resolve("src/lib/upload/zip-intake.ts")).href;
const instagramDetectorModuleUrl = pathToFileURL(path.resolve("src/lib/upload/instagram-csv-detector.ts")).href;

const { extractInstagramZipBufferToUploadArtifact } = await import(`${extractorModuleUrl}?t=${Date.now()}`);
const { inspectZipArchiveBuffer, toZipUploadRejection } = await import(`${zipIntakeModuleUrl}?t=${Date.now() + 1}`);
const { validateInstagramSchema } = await import(`${instagramDetectorModuleUrl}?t=${Date.now() + 2}`);

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
    const sourceData = entry.data ? encodeUtf8(entry.data) : new Uint8Array();
    const compressionMethod = entry.compressionMethod ?? 0;
    const dataBytes = compressionMethod === 8 ? new Uint8Array(deflateRawSync(sourceData)) : sourceData;

    const localHeader = [];
    pushUint32(localHeader, 0x04034b50);
    pushUint16(localHeader, 20);
    pushUint16(localHeader, 0);
    pushUint16(localHeader, compressionMethod);
    pushUint16(localHeader, 0);
    pushUint16(localHeader, 0);
    pushUint32(localHeader, 0);
    pushUint32(localHeader, dataBytes.length);
    pushUint32(localHeader, sourceData.length);
    pushUint16(localHeader, nameBytes.length);
    pushUint16(localHeader, 0);

    const localChunk = concatUint8Arrays([Uint8Array.from(localHeader), nameBytes, dataBytes]);
    localChunks.push(localChunk);

    const centralHeader = [];
    pushUint32(centralHeader, 0x02014b50);
    pushUint16(centralHeader, 20);
    pushUint16(centralHeader, 20);
    pushUint16(centralHeader, 0);
    pushUint16(centralHeader, compressionMethod);
    pushUint16(centralHeader, 0);
    pushUint16(centralHeader, 0);
    pushUint32(centralHeader, 0);
    pushUint32(centralHeader, dataBytes.length);
    pushUint32(centralHeader, sourceData.length);
    pushUint16(centralHeader, nameBytes.length);
    pushUint16(centralHeader, 0);
    pushUint16(centralHeader, 0);
    pushUint16(centralHeader, 0);
    pushUint16(centralHeader, 0);
    pushUint32(centralHeader, 0);
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

test("allowlisted instagram content csv zip is extracted and normalized into the existing instagram csv contract", async () => {
  const rawCsv = [
    "Post url,Caption,Media type,Publish date,Total impressions,Unique reach,Like count,Comment count,Share count,Save count,Profile activity,New followers",
    "\"https://www.instagram.com/p/zip123/\",\"Quoted, caption\",Reel,2026-02-01 09:30,1200,1000,80,12,9,15,22,3",
  ].join("\n");
  const archive = createSyntheticZip([
    {
      name: "content/instagram_content_export.csv",
      data: rawCsv,
      compressionMethod: 8,
    },
  ]);

  const inspection = inspectZipArchiveBuffer(archive, { name: "instagram.zip", size: archive.byteLength });
  const result = await extractInstagramZipBufferToUploadArtifact(archive, {
    inspection,
    fileName: "instagram.zip",
  });

  assert.equal(result.ok, true);
  assert.equal(result.detectedExportType, "instagram_content_export");
  assert.equal(result.sourceEntryPath, "content/instagram_content_export.csv");
  assert.equal(result.normalizedFilename, "instagram.normalized.csv");

  const normalizedLines = result.normalizedCsvText.split(/\r?\n/);
  assert.equal(
    normalizedLines[0],
    "Permalink,Description,Post type,Publish time,Impressions,Reach,Likes,Comments,Shares,Saves,Profile visits,Follows",
  );
  assert.equal(normalizedLines[1].includes('"Quoted, caption"'), true);

  const headers = normalizedLines[0].split(",");
  const validation = validateInstagramSchema(headers, normalizedLines.length - 1);
  assert.equal(validation.state, "valid_with_rows");
  assert.equal(result.rowCount, 1);
});

test("supported-shape instagram zips without the allowlisted csv fail deterministically", async () => {
  const archive = createSyntheticZip([
    { name: "content/posts_1.json", data: "{}" },
    { name: "connections/followers_1.json", data: "{}" },
  ]);
  const inspection = inspectZipArchiveBuffer(archive, { name: "instagram.zip", size: archive.byteLength });
  const result = await extractInstagramZipBufferToUploadArtifact(archive, {
    inspection,
    fileName: "instagram.zip",
  });

  assert.equal(inspection.kind, "supported_shape_instagram_candidate");
  assert.deepEqual(result, {
    ok: false,
    reasonCode: "instagram_required_file_missing",
    message: "Supported Instagram ZIP is missing the required allowlisted content CSV.",
    sourceEntryPath: null,
  });
});

test("supported-shape instagram zips with invalid allowlisted csv content fail deterministically", async () => {
  const archive = createSyntheticZip([
    {
      name: "content/instagram_content_export.csv",
      data: "Date,Reach,Impressions\n2026-02-01,100,200\n",
    },
  ]);
  const inspection = inspectZipArchiveBuffer(archive, { name: "instagram.zip", size: archive.byteLength });
  const result = await extractInstagramZipBufferToUploadArtifact(archive, {
    inspection,
    fileName: "instagram.zip",
  });

  assert.equal(result.ok, false);
  assert.equal(result.reasonCode, "instagram_required_content_invalid");
  assert.equal(result.sourceEntryPath, "content/instagram_content_export.csv");
});

test("unsupported and tiktok zip candidates do not enter instagram success path", async () => {
  const unsupportedArchive = createSyntheticZip([{ name: "notes/readme.txt", data: "hello" }]);
  const tiktokArchive = createSyntheticZip([
    { name: "tiktok data/profile/User Info.txt", data: "name: test" },
    { name: "tiktok data/activity/Like List.txt", data: "like list" },
  ]);

  const unsupportedInspection = inspectZipArchiveBuffer(unsupportedArchive, { name: "unsupported.zip", size: unsupportedArchive.byteLength });
  const tiktokInspection = inspectZipArchiveBuffer(tiktokArchive, { name: "tiktok.zip", size: tiktokArchive.byteLength });
  const unsupportedResult = await extractInstagramZipBufferToUploadArtifact(unsupportedArchive, {
    inspection: unsupportedInspection,
    fileName: "unsupported.zip",
  });
  const tiktokResult = await extractInstagramZipBufferToUploadArtifact(tiktokArchive, {
    inspection: tiktokInspection,
    fileName: "tiktok.zip",
  });

  assert.equal(toZipUploadRejection(unsupportedInspection)?.reasonCode, "unsupported_archive_shape");
  assert.equal(unsupportedResult.ok, false);
  assert.equal(unsupportedResult.reasonCode, "instagram_supported_shape_but_unparseable");
  assert.equal(tiktokInspection.kind, "supported_shape_tiktok_candidate");
  assert.equal(tiktokResult.ok, false);
  assert.equal(tiktokResult.reasonCode, "instagram_supported_shape_but_unparseable");
});
