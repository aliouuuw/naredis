/** Zones / terminaux courants (pilot Dakar). Extensible via réglages plus tard. */

export type PilotZoneTerminal = {
  slug: string;
  label: string;
};

export const PILOT_ZONE_TERMINALS: PilotZoneTerminal[] = [
  { slug: "18N", label: "18N" },
  { slug: "DPW", label: "DPW — Dakar port" },
  { slug: "DKR", label: "DKR — Dakar" },
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
