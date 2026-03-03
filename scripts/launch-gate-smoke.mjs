#!/usr/bin/env node

const apiBaseUrl = (process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "").trim().replace(/\/+$/, "");
const bearerToken = process.env.API_TOKEN ?? process.env.TOKEN ?? "";

if (!apiBaseUrl) {
  console.error("[launch-gate] Missing API_BASE_URL (or NEXT_PUBLIC_API_BASE_URL).");
  process.exit(1);
}

const defaultHeaders = {
  Accept: "application/json",
  "Content-Type": "application/json",
  ...(bearerToken ? { Authorization: `Bearer ${bearerToken}` } : {}),
};

async function parseJsonOrText(response) {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return { raw: text };
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function isObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function hasErrorShape(value) {
  if (!isObject(value)) {
    return false;
  }

  return typeof value.message === "string" || typeof value.detail === "string" || isObject(value.error);
}

function hasStatusSchema(value) {
  if (!isObject(value)) {
    return false;
  }

  const status = value.status;
  const uploadId = value.upload_id ?? value.uploadId;

  const statusValid = status === undefined || status === null || typeof status === "string";
  const uploadIdValid = uploadId === undefined || uploadId === null || typeof uploadId === "string";

  return statusValid && uploadIdValid;
}

async function main() {
  const presignPayload = {
    platform: "youtube",
    filename: "launch-gate-smoke.csv",
    content_type: "text/csv",
    size: 128,
  };

  const presignResponse = await fetch(`${apiBaseUrl}/v1/uploads/presign`, {
    method: "POST",
    headers: defaultHeaders,
    body: JSON.stringify(presignPayload),
  });
  const presignBody = await parseJsonOrText(presignResponse);

  assert(
    presignResponse.status < 500,
    `Presign returned ${presignResponse.status} (must be non-500). Body: ${JSON.stringify(presignBody)}`,
  );

  const uploadIdFromPresign = isObject(presignBody)
    ? (presignBody.upload_id ?? presignBody.uploadId)
    : undefined;
  const uploadId =
    (typeof uploadIdFromPresign === "string" && uploadIdFromPresign) ||
    (process.env.UPLOAD_ID ?? "").trim();

  const statusPath = uploadId
    ? `/v1/uploads/${encodeURIComponent(uploadId)}/status`
    : "/v1/uploads/latest/status";

  const statusResponse = await fetch(`${apiBaseUrl}${statusPath}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      ...(bearerToken ? { Authorization: `Bearer ${bearerToken}` } : {}),
    },
  });
  const statusBody = await parseJsonOrText(statusResponse);

  assert(
    statusResponse.status < 500,
    `Status endpoint returned ${statusResponse.status}. Body: ${JSON.stringify(statusBody)}`,
  );

  if (statusResponse.ok) {
    assert(hasStatusSchema(statusBody), `Status endpoint schema mismatch: ${JSON.stringify(statusBody)}`);
  } else {
    assert(
      hasErrorShape(statusBody),
      `Status endpoint returned non-2xx without recognizable error shape: ${JSON.stringify(statusBody)}`,
    );
  }

  console.log(`[launch-gate] PASS presign=${presignResponse.status} status=${statusResponse.status} path=${statusPath}`);
}

main().catch((error) => {
  console.error(`[launch-gate] FAIL ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
