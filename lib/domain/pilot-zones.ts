/** Zones / terminaux (démo pilote). Extensible via réglages plus tard. */

export type PilotZoneTerminal = {
  slug: string;
  label: string;
};

export const PILOT_ZONE_TERMINALS: PilotZoneTerminal[] = [
  { slug: "18N", label: "18N" },
  { slug: "DPW", label: "DPW — terminal port" },
  { slug: "DKR", label: "DKR — zone urbaine" },
  { slug: "ABJ", label: "ABJ — Abidjan (transit)" },
  { slug: "RUF", label: "RUF — Rufisque" },
  { slug: "AIBD", label: "AIBD — Aéroport Blaise Diagne" },
];

export function pilotZoneOptions(): Array<{ value: string; label: string }> {
  return PILOT_ZONE_TERMINALS.map((z) => ({
    value: z.slug,
    label: z.label,
  }));
}

/** Pilot list + zones already used on déclarations (free-text allowed). */
export function mergeZoneSuggestions(
  usedZones: string[],
): Array<{ value: string; label?: string; hint?: string; group?: string }> {
  const seen = new Set<string>();
  const out: Array<{
    value: string;
    label?: string;
    hint?: string;
    group?: string;
  }> = [];

  for (const z of PILOT_ZONE_TERMINALS) {
    const v = z.slug.trim();
    if (!v || seen.has(v)) continue;
    seen.add(v);
    out.push({
      value: v,
      label: z.label,
      group: "Zones pilote",
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
