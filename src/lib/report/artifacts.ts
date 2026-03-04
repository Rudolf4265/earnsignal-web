import { ApiError, getApiBaseOrigin } from "../api/client";

function resolveArtifactUrl(pathOrUrl: string, origin = getApiBaseOrigin()): string {
  return new URL(pathOrUrl, origin).toString();
}

function readRequestId(response: Response): string | undefined {
  return response.headers.get("x-request-id") ?? undefined;
}

export async function fetchReportJsonArtifact(params: {
  artifactJsonUrl: string;
  token: string;
  fetchImpl?: typeof fetch;
  origin?: string;
}): Promise<Record<string, unknown>> {
  const response = await (params.fetchImpl ?? fetch)(resolveArtifactUrl(params.artifactJsonUrl, params.origin), {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${params.token}`,
    },
  });

  if (!response.ok) {
    throw new ApiError({
      status: response.status,
      code: `HTTP_${response.status}`,
      message: `Unable to load report JSON artifact (status ${response.status}).`,
      operation: "report.artifact.json",
      path: params.artifactJsonUrl,
      method: "GET",
      requestId: readRequestId(response),
    });
  }

  const contentType = (response.headers.get("content-type") ?? "").toLowerCase();
  if (!contentType.includes("application/json") && !contentType.includes("+json")) {
    throw new ApiError({
      status: response.status,
      code: "UNEXPECTED_CONTENT_TYPE",
      message: `Expected JSON artifact but received ${response.status} (${contentType || "unknown content-type"}).`,
      operation: "report.artifact.json",
      path: params.artifactJsonUrl,
      method: "GET",
      requestId: readRequestId(response),
      details: { contentType },
    });
  }

  const payload = (await response.json()) as unknown;
  if (!payload || typeof payload !== "object") {
    throw new ApiError({
      status: response.status,
      code: "INVALID_JSON_RESPONSE",
      message: "Report JSON artifact payload is invalid.",
      operation: "report.artifact.json",
      path: params.artifactJsonUrl,
      method: "GET",
      requestId: readRequestId(response),
    });
  }

  return payload as Record<string, unknown>;
}

export async function fetchReportPdfArtifact(params: {
  artifactUrl: string;
  token: string;
  fetchImpl?: typeof fetch;
  origin?: string;
}): Promise<Blob> {
  const response = await (params.fetchImpl ?? fetch)(resolveArtifactUrl(params.artifactUrl, params.origin), {
    method: "GET",
    headers: {
      Accept: "application/pdf",
      Authorization: `Bearer ${params.token}`,
    },
  });

  if (!response.ok) {
    throw new ApiError({
      status: response.status,
      code: `HTTP_${response.status}`,
      message: `Unable to load report PDF artifact (status ${response.status}).`,
      operation: "report.artifact.pdf",
      path: params.artifactUrl,
      method: "GET",
      requestId: readRequestId(response),
    });
  }

  const contentType = (response.headers.get("content-type") ?? "").toLowerCase();
  if (!contentType.includes("application/pdf")) {
    throw new ApiError({
      status: response.status,
      code: "UNEXPECTED_CONTENT_TYPE",
      message: `Expected PDF artifact but received ${response.status} (${contentType || "unknown content-type"}).`,
      operation: "report.artifact.pdf",
      path: params.artifactUrl,
      method: "GET",
      requestId: readRequestId(response),
      details: { contentType },
    });
  }

  return response.blob();
}
