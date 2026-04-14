import fs from "node:fs";
import path from "node:path";

export type E2ERole = "free" | "report" | "pro";

export type E2ECredentials = {
  email: string;
  password: string;
};

const ROLE_ENV_PREFIX: Record<E2ERole, string> = {
  free: "E2E_FREE",
  report: "E2E_REPORT",
  pro: "E2E_PRO",
};

export const DEFAULT_PDF_TIMEOUT_MS = 60_000;
export const DEFAULT_REPORT_RUN_TIMEOUT_MS = 180_000;

let dotEnvLoaded = false;

export function loadDotEnvLocal() {
  if (dotEnvLoaded) {
    return;
  }

  dotEnvLoaded = true;
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) {
    return;
  }

  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
      continue;
    }

    const [key, ...rest] = trimmed.split("=");
    if (!key || process.env[key] !== undefined) {
      continue;
    }

    process.env[key] = rest.join("=").trim().replace(/^['"]|['"]$/g, "");
  }
}

export function requiredEnv(name: string): string {
  loadDotEnvLocal();
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function optionalNumberEnv(name: string, fallback: number): number {
  loadDotEnvLocal();
  const value = process.env[name]?.trim();
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive number of milliseconds.`);
  }

  return Math.trunc(parsed);
}

export function getBaseUrl(): string {
  return requiredEnv("E2E_BASE_URL").replace(/\/+$/, "");
}

export function getApiBaseUrl(): string {
  return requiredEnv("E2E_API_BASE_URL").replace(/\/+$/, "");
}

export function getCredentials(role: E2ERole): E2ECredentials {
  const prefix = ROLE_ENV_PREFIX[role];
  return {
    email: requiredEnv(`${prefix}_EMAIL`),
    password: requiredEnv(`${prefix}_PASSWORD`),
  };
}

export function authStatePath(role: E2ERole): string {
  return path.resolve(process.cwd(), "tests", "e2e", ".auth", `${role}.json`);
}

export function roleFromProjectName(projectName: string): E2ERole {
  if (projectName.startsWith("free")) {
    return "free";
  }
  if (projectName.startsWith("pro")) {
    return "pro";
  }
  return "report";
}

export function getReportRunTimeoutMs(): number {
  return optionalNumberEnv("E2E_REPORT_RUN_TIMEOUT_MS", DEFAULT_REPORT_RUN_TIMEOUT_MS);
}

export function getPdfTimeoutMs(): number {
  return optionalNumberEnv("E2E_PDF_TIMEOUT_MS", DEFAULT_PDF_TIMEOUT_MS);
}
