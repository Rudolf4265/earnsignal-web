import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const TS_EXTENSIONS = [".ts", ".tsx"];

function isRelativeSpecifier(specifier) {
  return specifier.startsWith("./") || specifier.startsWith("../") || specifier.startsWith("/");
}

function hasKnownExtension(specifier) {
  return [".js", ".mjs", ".cjs", ".json", ...TS_EXTENSIONS].includes(path.extname(specifier));
}

function resolveExistingTsSpecifier(specifier, context) {
  if (!context.parentURL || !context.parentURL.startsWith("file:")) {
    return null;
  }

  const parentPath = fileURLToPath(context.parentURL);
  const candidateBase = path.resolve(path.dirname(parentPath), specifier);
  for (const extension of TS_EXTENSIONS) {
    const candidatePath = `${candidateBase}${extension}`;
    if (existsSync(candidatePath)) {
      return pathToFileURL(candidatePath).href;
    }
  }

  return null;
}

export async function resolve(specifier, context, defaultResolve) {
  if (isRelativeSpecifier(specifier) && !hasKnownExtension(specifier)) {
    const resolvedTsUrl = resolveExistingTsSpecifier(specifier, context);
    if (resolvedTsUrl) {
      return defaultResolve(resolvedTsUrl, context, defaultResolve);
    }
  }

  try {
    return await defaultResolve(specifier, context, defaultResolve);
  } catch (error) {
    if (!isRelativeSpecifier(specifier) || hasKnownExtension(specifier)) {
      throw error;
    }

    for (const extension of TS_EXTENSIONS) {
      try {
        return await defaultResolve(`${specifier}${extension}`, context, defaultResolve);
      } catch {
        // Try the next extension.
      }
    }

    throw error;
  }
}
