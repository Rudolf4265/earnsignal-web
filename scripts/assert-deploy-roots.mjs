import fs from "node:fs";
import path from "node:path";

const roots = ["apps/app", "apps/site"];

function fail(message) {
  console.error(`❌ ${message}`);
  process.exitCode = 1;
}

function exists(filePath) {
  return fs.existsSync(filePath);
}

function hasLayoutFile(appRoot) {
  const appDir = path.join(appRoot, "app");
  const candidates = ["layout.tsx", "layout.ts", "layout.js"];
  return candidates.some((name) => exists(path.join(appDir, name)));
}

for (const root of roots) {
  if (!exists(root)) {
    fail(`Missing deploy root directory: ${root}`);
    continue;
  }

  const packageJsonPath = path.join(root, "package.json");
  if (!exists(packageJsonPath)) {
    fail(`Missing package.json in ${root}`);
  }

  if (!hasLayoutFile(root)) {
    fail(`Missing app/layout.(tsx|ts|js) in ${root}`);
  }
}

if (process.exitCode) {
  process.exit(process.exitCode);
}

console.log("✅ Deploy root assertions passed for apps/app and apps/site.");
