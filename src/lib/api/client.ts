import { ApiResponseError, fetchApiJson } from "./http";

export class ApiClientError extends Error {
  status: number;
  code: string;
  details?: unknown;

  constructor(message: string, status: number, code: string, details?: unknown) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

async function getBrowserAccessToken(): Promise<string | null> {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const { createClient } = await import("../supabase/client");
    const {
      data: { session },
    } = await createClient().auth.getSession();

    return session?.access_token ?? null;
  } catch {
    return null;
  }
}

export async function apiClientJson<T>(path: string, init: RequestInit = {}, context?: string): Promise<T> {
  const token = await getBrowserAccessToken();
  const hasBody = init.body !== undefined && init.body !== null;

  const headers: Record<string, string> = {
    ...(init.headers as Record<string, string> | undefined),
  };

  if (hasBody && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    return await fetchApiJson<T>(path, {
      ...init,
      headers,
    }, context);
  } catch (error) {
    if (error instanceof ApiResponseError) {
      if (error.status === 401 && (error.code === "MISSING_TOKEN" || error.code === "SESSION_EXPIRED")) {
        throw new ApiClientError("Session expired. Please sign in again.", 401, "SESSION_EXPIRED", error.details);
      }

      throw new ApiClientError(error.message, error.status, error.code ?? "UNKNOWN", error.details);
    }

    throw error;
  }
}

export function isSessionExpiredError(error: unknown): error is ApiClientError {
  return error instanceof ApiClientError && error.code === "SESSION_EXPIRED";
}
