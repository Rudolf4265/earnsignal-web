import fs from "node:fs";
import path from "node:path";

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function hasCssArtifacts(appRoot) {
  const staticDir = path.join(appRoot, ".next", "static");
  if (!fs.existsSync(staticDir)) return false;

  const stack = [staticDir];
  while (stack.length) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(full);
      } else if (entry.isFile() && entry.name.endsWith(".css")) {
        return true;
      }
    }
  }

  return false;
}

const appManifest = readJson("apps/app/.next/server/app-paths-manifest.json");
const appKeys = Object.keys(appManifest);
assert(appKeys.some((route) => route.includes("/login/page")), "app build missing /login route");
assert(appKeys.some((route) => route.includes("/app/page")), "app build missing /app route");
assert(hasCssArtifacts("apps/app"), "app build missing CSS artifacts in .next/static");

const siteManifest = readJson("apps/site/.next/server/app-paths-manifest.json");
const siteKeys = Object.keys(siteManifest);
assert(siteKeys.some((route) => route.includes("/(marketing)/page")), "site build missing landing page route");
assert(hasCssArtifacts("apps/site"), "site build missing CSS artifacts in .next/static");

const heroSource = fs.readFileSync("apps/site/components/marketing/Hero.tsx", "utf8");
assert(heroSource.includes('href="https://app.earnsigma.com/login"'), "site CTA is not pinned to https://app.earnsigma.com/login");

console.log("Build assertions passed for apps/app and apps/site.");
