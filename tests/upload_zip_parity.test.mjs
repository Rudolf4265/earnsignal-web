import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { deflateRawSync } from "node:zlib";

const instagramExtractorModuleUrl = pathToFileURL(path.resolve("src/lib/upload/instagram-zip-extractor.ts")).href;
const tiktokExtractorModuleUrl = pathToFileURL(path.resolve("src/lib/upload/tiktok-zip-extractor.ts")).href;
const zipIntakeModuleUrl = pathToFileURL(path.resolve("src/lib/upload/zip-intake.ts")).href;

const { extractInstagramZipBufferToUploadArtifact } = await import(`${instagramExtractorModuleUrl}?t=${Date.now()}`);
const { extractTiktokZipBufferToUploadArtifact } = await import(`${tiktokExtractorModuleUrl}?t=${Date.now() + 1}`);
const { inspectZipArchiveBuffer } = await import(`${zipIntakeModuleUrl}?t=${Date.now() + 2}`);

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

test("instagram ZIP normalization matches the direct normalized CSV contract", async () => {
  const rawCsv = [
    "Post url,Caption,Media type,Publish date,Total impressions,Unique reach,Like count,Comment count,Share count,Save count,Profile activity,New followers",
    "\"https://www.instagram.com/p/zip123/\",\"Quoted, caption\",Reel,2026-02-01 09:30,1200,1000,80,12,9,15,22,3",
  ].join("\n");
  const expectedCsv = [
    "Permalink,Description,Post type,Publish time,Impressions,Reach,Likes,Comments,Shares,Saves,Profile visits,Follows",
    "https://www.instagram.com/p/zip123/,\"Quoted, caption\",Reel,2026-02-01 09:30,1200,1000,80,12,9,15,22,3",
  ].join("\n");
  const archive = createSyntheticZip([{ name: "content/instagram_content_export.csv", data: rawCsv, compressionMethod: 8 }]);

  const inspection = inspectZipArchiveBuffer(archive, { name: "instagram.zip", size: archive.byteLength });
  const result = await extractInstagramZipBufferToUploadArtifact(archive, {
    inspection,
    fileName: "instagram.zip",
  });

  assert.equal(result.ok, true);
  assert.equal(result.normalizedCsvText, expectedCsv);
});

test("tiktok ZIP normalization matches the direct normalized CSV contract", async () => {
  const rawCsv = [
    "Date,Views,Like count,Comment count,Share count,Profile activity,New followers",
    "2026-02-01,1500,120,14,11,45,6",
  ].join("\n");
  const expectedCsv = [
    "Date,Video views,Likes,Comments,Shares,Profile views,Followers gained",
    "2026-02-01,1500,120,14,11,45,6",
  ].join("\n");
  const archive = createSyntheticZip([{ name: "tiktok data/tiktok_performance_export.csv", data: rawCsv, compressionMethod: 8 }]);

  const inspection = inspectZipArchiveBuffer(archive, { name: "tiktok.zip", size: archive.byteLength });
  const result = await extractTiktokZipBufferToUploadArtifact(archive, {
    inspection,
    fileName: "tiktok.zip",
  });

  assert.equal(result.ok, true);
  assert.equal(result.normalizedCsvText, expectedCsv);
});
