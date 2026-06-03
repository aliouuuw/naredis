/** Default zones seeded per org; editable in Réglages. */

export type PilotZoneTerminal = {
  slug: string;
  label: string;
};

export const DEFAULT_ZONE_TERMINALS: PilotZoneTerminal[] = [
  { slug: "18N", label: "18N" },
  { slug: "DPW", label: "DPW — terminal port" },
  { slug: "DKR", label: "DKR — zone urbaine" },
  { slug: "ABJ", label: "ABJ — Abidjan (transit)" },
  { slug: "RUF", label: "RUF — Rufisque" },
  { slug: "AIBD", label: "AIBD — Aéroport Blaise Diagne" },
];

/** @deprecated Use DEFAULT_ZONE_TERMINALS */
export const PILOT_ZONE_TERMINALS = DEFAULT_ZONE_TERMINALS;

export function pilotZoneOptions(
  catalog: PilotZoneTerminal[] = DEFAULT_ZONE_TERMINALS,
): Array<{ value: string; label: string }> {
  return catalog.map((z) => ({
    value: z.slug,
    label: z.label,
  }));
}

/** Org catalog + zones already used on déclarations (legacy free-text). */
export function mergeZoneSuggestions(
  catalog: PilotZoneTerminal[],
  usedZones: string[],
): Array<{ value: string; label?: string; hint?: string; group?: string }> {
  const seen = new Set<string>();
  const out: Array<{
    value: string;
    label?: string;
    hint?: string;
    group?: string;
  }> = [];

  for (const z of catalog) {
    const v = z.slug.trim();
    if (!v || seen.has(v)) continue;
    seen.add(v);
    out.push({
      value: v,
      label: z.label,
      group: "Zones configurées",
    });
  }

  for (const raw of usedZones) {
    const v = raw.trim();
    if (!v || seen.has(v)) continue;
    seen.add(v);
    out.push({
      value: v,
      label: v,
      group: "Déjà utilisées",
    });
  }

  return out;
}
