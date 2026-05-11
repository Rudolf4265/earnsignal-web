import { existsSync } from "node:fs";
import path from "node:path";

export const port = Number.parseInt(process.env.PORT ?? "3100", 10);
export const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://app.earnsigma.com:${port}`;
export const appWorkspaceRoot = path.resolve(__dirname, "../..");
export const webServerUrl = process.env.PLAYWRIGHT_WEB_SERVER_URL ?? `http://127.0.0.1:${port}/`;
export const hasBuiltApp = existsSync(path.join(appWorkspaceRoot, ".next", "BUILD_ID"));
export const nextBinPath = path.join(appWorkspaceRoot, "node_modules", "next", "dist", "bin", "next");
export const nodeBinPath = process.execPath;
export const nextArgs = hasBuiltApp ? ["start", "--port", String(port)] : ["dev", "--port", String(port), "--webpack"];
export const serverStartupTimeoutMs = 120_000;
export const reuseExistingServer = !process.env.CI;
