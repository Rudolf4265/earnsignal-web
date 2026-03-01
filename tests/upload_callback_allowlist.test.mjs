import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { readFile, writeFile, mkdir } from "node:fs/promises";

const uploadSourcePath = path.resolve("src/lib/api/upload.ts");

async function buildUploadModule(tag) {
  const source = await readFile(uploadSourcePath, "utf8");
  const patched = source.replace("./client", "../src/lib/api/client.ts");
  const outDir = path.resolve(".tmp-tests");
  await mkdir(outDir, { recursive: true });
  const outFile = path.join(outDir, `upload-${tag}.ts`);
  await writeFile(outFile, patched, "utf8");
  return pathToFileURL(outFile).href;
}

test("finalizeUploadCallback ignores callback_url on foreign origin", async () => {
  const originalFetch = global.fetch;
  process.env.NEXT_PUBLIC_API_BASE_URL = "https://api.example.test";

  const urls = [];
  global.fetch = async (url) => {
    urls.push(String(url));
    return {
      ok: true,
      status: 200,
      headers: { get: () => "application/json" },
      text: async () => JSON.stringify({ upload_id: "up_1" }),
    };
  };

  try {
    const uploadUrl = await buildUploadModule(Date.now());
    const { finalizeUploadCallback } = await import(`${uploadUrl}?t=${Date.now()}`);
    await finalizeUploadCallback(
      {
        upload_id: "up_1",
        platform: "youtube",
        filename: "a.csv",
        size: 1,
        content_type: "text/csv",
      },
      "https://evil.example.net/callback",
    );

    assert.equal(urls[0], "https://api.example.test/v1/uploads/callback");
  } finally {
    global.fetch = originalFetch;
  }
});
