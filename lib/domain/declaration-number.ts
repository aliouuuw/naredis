/** Pilot desk format: `{prefix}-{zone}-D{suffix}` e.g. `1-18N-D001`. */

const NUMBER_PART = /^[A-Za-z0-9]+$/;
const SUFFIX_PART = /^\d{1,6}$/;

export function normalizeDeclarationSuffix(raw: string): string {
  const trimmed = raw.trim().replace(/^D/i, "");
  return trimmed;
}

export function buildDeclarationNumber(
  prefix: string,
  zoneSlug: string,
  suffix: string,
): string {
  const p = prefix.trim();
  const z = zoneSlug.trim();
  const s = normalizeDeclarationSuffix(suffix);
  if (!p || !z || !s) {
    throw new Error("Numéro de déclaration incomplet.");
  }
  if (!NUMBER_PART.test(p)) {
    throw new Error("Le préfixe ne doit contenir que des lettres et chiffres.");
  }
  if (!NUMBER_PART.test(z)) {
    throw new Error("La zone ne doit contenir que des lettres et chiffres.");
  }
  if (!SUFFIX_PART.test(s)) {
    throw new Error("Le suffixe doit être numérique (ex. 001).");
  }
  const padded = s.padStart(3, "0");
  return `${p}-${z}-D${padded}`;
}

export function isValidDeclarationNumber(value: string): boolean {
  return /^\d+[A-Za-z0-9]+-[A-Za-z0-9]+-D\d{3,6}$/.test(value.trim());
}

/** Parse pilot format for suggestion reuse (prefix / zone / suffix). */
export function parseDeclarationNumberParts(
  declarationNumber: string,
): { prefix: string; zone: string; suffix: string } | null {
  const m = declarationNumber.trim().match(/^(\d+)-([A-Za-z0-9]+)-D(\d{1,6})$/i);
  if (!m) return null;
  return {
    prefix: m[1]!,
    zone: m[2]!,
    suffix: m[3]!.replace(/^0+/, "") || "0",
  };
}
