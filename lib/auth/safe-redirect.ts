const DEFAULT_PATH = "/declarations";

/** Only allow same-origin relative paths (blocks open redirects). */
export function sanitizeRedirectPath(
  path: string | null | undefined,
  fallback: string = DEFAULT_PATH,
): string {
  if (!path) {
    return fallback;
  }
  if (!path.startsWith("/") || path.startsWith("//")) {
    return fallback;
  }
  return path;
}
