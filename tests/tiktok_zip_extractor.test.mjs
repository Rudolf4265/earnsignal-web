import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { deflateRawSync } from "node:zlib";

const extractorModuleUrl = pathToFileURL(path.resolve("src/lib/upload/tiktok-zip-extractor.ts")).href;
const zipIntakeModuleUrl = pathToFileURL(path.resolve("src/lib/upload/zip-intake.ts")).href;

const { extractTiktokZipBufferToUploadArtifact } = await import(`${extractorModuleUrl}?t=${Date.now()}`);
const { inspectZipArchiveBuffer, toZipUploadRejection } = await import(`${zipIntakeModuleUrl}?t=${Date.now() + 1}`);

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

test("allowlisted tiktok performance csv zip is extracted and normalized into the existing tiktok csv contract", async () => {
  const rawCsv = [
    "Date,Views,Like count,Comment count,Share count,Profile activity,New followers",
    "2026-02-01,1500,120,14,11,45,6",
  ].join("\n");
  const archive = createSyntheticZip([
    {
      name: "tiktok data/tiktok_performance_export.csv",
      data: rawCsv,
      compressionMethod: 8,
    },
  ]);

  const inspection = inspectZipArchiveBuffer(archive, { name: "tiktok.zip", size: archive.byteLength });
  const result = await extractTiktokZipBufferToUploadArtifact(archive, {
    inspection,
    fileName: "tiktok.zip",
  });

  assert.equal(result.ok, true);
  assert.equal(result.sourceEntryPath, "tiktok data/tiktok_performance_export.csv");
  assert.equal(result.normalizedFilename, "tiktok.normalized.csv");

  const normalizedLines = result.normalizedCsvText.split(/\r?\n/);
  assert.equal(
    normalizedLines[0],
    "Date,Video views,Likes,Comments,Shares,Profile views,Followers gained",
  );
  assert.equal(normalizedLines[1], "2026-02-01,1500,120,14,11,45,6");
  assert.equal(result.rowCount, 1);
});

test("supported-shape tiktok zips without the allowlisted csv fail deterministically", async () => {
  const archive = createSyntheticZip([
    { name: "tiktok data/profile/User Info.txt", data: "name: test" },
    { name: "tiktok data/activity/Like List.txt", data: "likes" },
  ]);
  const inspection = inspectZipArchiveBuffer(archive, { name: "tiktok.zip", size: archive.byteLength });
  const result = await extractTiktokZipBufferToUploadArtifact(archive, {
    inspection,
    fileName: "tiktok.zip",
  });

  assert.equal(inspection.kind, "supported_shape_tiktok_candidate");
  assert.deepEqual(result, {
    ok: false,
    reasonCode: "tiktok_required_file_missing",
    message: "Supported TikTok ZIP is missing the required allowlisted performance CSV.",
    sourceEntryPath: null,
  });
});

test("supported-shape tiktok zips with invalid allowlisted csv content fail deterministically", async () => {
  const archive = createSyntheticZip([
    {
      name: "tiktok data/tiktok_performance_export.csv",
      data: "Profile,Followers\nmain,1000\n",
    },
  ]);
  const inspection = inspectZipArchiveBuffer(archive, { name: "tiktok.zip", size: archive.byteLength });
  const result = await extractTiktokZipBufferToUploadArtifact(archive, {
    inspection,
    fileName: "tiktok.zip",
  });

  assert.equal(result.ok, false);
  assert.equal(result.reasonCode, "tiktok_required_content_invalid");
  assert.equal(result.sourceEntryPath, "tiktok data/tiktok_performance_export.csv");
});

test("unsupported and instagram zip candidates do not enter tiktok success path", async () => {
  const unsupportedArchive = createSyntheticZip([{ name: "notes/readme.txt", data: "hello" }]);
  const instagramArchive = createSyntheticZip([
    { name: "content/posts_1.json", data: "{}" },
    { name: "connections/followers_1.json", data: "{}" },
  ]);

  const unsupportedInspection = inspectZipArchiveBuffer(unsupportedArchive, { name: "unsupported.zip", size: unsupportedArchive.byteLength });
  const instagramInspection = inspectZipArchiveBuffer(instagramArchive, { name: "instagram.zip", size: instagramArchive.byteLength });
  const unsupportedResult = await extractTiktokZipBufferToUploadArtifact(unsupportedArchive, {
    inspection: unsupportedInspection,
    fileName: "unsupported.zip",
  });
  const instagramResult = await extractTiktokZipBufferToUploadArtifact(instagramArchive, {
    inspection: instagramInspection,
    fileName: "instagram.zip",
  });

  assert.equal(toZipUploadRejection(unsupportedInspection)?.reasonCode, "unsupported_archive_shape");
  assert.equal(unsupportedResult.ok, false);
  assert.equal(unsupportedResult.reasonCode, "tiktok_supported_shape_but_unparseable");
  assert.equal(instagramInspection.kind, "supported_shape_instagram_candidate");
  assert.equal(instagramResult.ok, false);
  assert.equal(instagramResult.reasonCode, "tiktok_supported_shape_but_unparseable");
});
