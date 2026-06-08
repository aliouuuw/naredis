/** Normalize zone / terminal slug for grouping and lookup. */

export function normalizeZoneSlugForLookup(input: string): string {
  return input.trim().toUpperCase().replace(/\s+/g, "");
}
