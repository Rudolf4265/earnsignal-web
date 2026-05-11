import { spawn } from "node:child_process";
import http from "node:http";
import https from "node:https";
import readline from "node:readline";
import type { FullConfig } from "@playwright/test";
import {
  appWorkspaceRoot,
  nextArgs,
  nextBinPath,
  nodeBinPath,
  reuseExistingServer,
  serverStartupTimeoutMs,
  webServerUrl,
} from "./server-config";

function prefixServerLog(line: string) {
  return `[WebServer] ${line}`;
}

function readStreamLines(stream: NodeJS.ReadableStream | null, onLine: (line: string) => void) {
  if (!stream) {
    return;
  }

  const reader = readline.createInterface({ input: stream });
  reader.on("line", onLine);
}

function isServerAvailable(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const target = new URL(url);
    const transport = target.protocol === "https:" ? https : http;
    const request = transport.request(
      target,
      {
        method: "GET",
        timeout: 5_000,
      },
      (response) => {
        response.resume();
        resolve(Boolean(response.statusCode && response.statusCode < 500));
      },
    );

    request.on("timeout", () => {
      request.destroy();
      resolve(false);
    });
    request.on("error", () => resolve(false));
    request.end();
  });
}

async function waitForServer(url: string, timeoutMs: number, onEarlyExit: Promise<never>) {
  const deadline = Date.now() + timeoutMs;
  const delays = [100, 250, 500];

  while (Date.now() < deadline) {
    const available = await Promise.race([
      isServerAvailable(url),
      onEarlyExit,
    ]);

    if (available) {
      return;
    }

    const delay = delays.shift() ?? 1_000;
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  throw new Error(`Timed out waiting ${timeoutMs}ms for ${url}`);
}

async function waitForChildExit(child: ReturnType<typeof spawn>, timeoutMs: number): Promise<boolean> {
  if (child.exitCode !== null || child.signalCode !== null) {
    return true;
  }

  return await Promise.race([
    new Promise<boolean>((resolve) => child.once("exit", () => resolve(true))),
    new Promise<boolean>((resolve) => setTimeout(() => resolve(false), timeoutMs)),
  ]);
}

async function forceKillProcessTree(pid: number): Promise<void> {
  if (process.platform === "win32") {
    await new Promise<void>((resolve, reject) => {
      const killer = spawn("taskkill", ["/pid", String(pid), "/T", "/F"], {
        stdio: "pipe",
        windowsHide: true,
      });

      let stderr = "";
      killer.stderr?.on("data", (chunk) => {
        stderr += chunk.toString();
      });

      killer.on("error", reject);
      killer.on("close", (code) => {
        if (code === 0 || /not found|no running instance/i.test(stderr)) {
          resolve();
          return;
        }
        reject(new Error(stderr || `taskkill exited with code ${code}`));
      });
    });
    return;
  }

  process.kill(-pid, "SIGKILL");
}

export default async function globalSetup(_config: FullConfig) {
  if (reuseExistingServer && await isServerAvailable(webServerUrl)) {
    return;
  }

  const child = spawn(nodeBinPath, [nextBinPath, ...nextArgs], {
    cwd: appWorkspaceRoot,
    env: {
      ...process.env,
      BROWSER: "none",
      FORCE_COLOR: "1",
      DEBUG_COLORS: "1",
    },
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
    detached: process.platform !== "win32",
  });

  if (!child.pid) {
    throw new Error("Failed to start the Playwright web server process.");
  }

  readStreamLines(child.stdout, (line) => {
    process.stdout.write(`${prefixServerLog(line)}\n`);
  });
  readStreamLines(child.stderr, (line) => {
    process.stderr.write(`${prefixServerLog(line)}\n`);
  });

  const onEarlyExit = new Promise<never>((_, reject) => {
    child.once("exit", (code, signal) => {
      reject(new Error(`Playwright web server exited early with code=${code ?? "null"} signal=${signal ?? "null"}`));
    });
  });

  try {
    await waitForServer(webServerUrl, serverStartupTimeoutMs, onEarlyExit);
  } catch (error) {
    await forceKillProcessTree(child.pid).catch(() => {});
    throw error;
  }

  return async () => {
    if (!child.pid || child.exitCode !== null || child.signalCode !== null) {
      return;
    }

    child.kill();

    const exited = await waitForChildExit(child, 10_000);
    if (exited) {
      return;
    }

    await forceKillProcessTree(child.pid);
    await waitForChildExit(child, 10_000);
  };
}
