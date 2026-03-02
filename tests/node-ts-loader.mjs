import path from "node:path";

const TS_EXTENSIONS = [".ts", ".tsx"];

function isRelativeSpecifier(specifier) {
  return specifier.startsWith("./") || specifier.startsWith("../") || specifier.startsWith("/");
}

function hasKnownExtension(specifier) {
  return [".js", ".mjs", ".cjs", ".json", ...TS_EXTENSIONS].includes(path.extname(specifier));
}

export async function resolve(specifier, context, defaultResolve) {
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
