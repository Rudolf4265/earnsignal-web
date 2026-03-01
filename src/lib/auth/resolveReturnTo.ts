export function resolveReturnTo(rawReturnTo: string | null): string | null {
  if (!rawReturnTo) {
    return null;
  }

  const trimmed = rawReturnTo.trim();

  if (!trimmed.startsWith("/")) {
    return null;
  }

  if (trimmed.startsWith("//")) {
    return null;
  }

  if (trimmed.includes("://")) {
    return null;
  }

  try {
    const parsed = new URL(trimmed, "http://localhost");
    if (parsed.origin !== "http://localhost") {
      return null;
    }
  } catch {
    return null;
  }

  return trimmed;
}
