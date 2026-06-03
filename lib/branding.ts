/**
 * Product branding (white-label shell). Tenant names in seed/DB stay independent.
 */
export const productBrand = {
  name: "Naredis",
  monogram: "NR",
  /** One line under the logo on marketing surfaces */
  tagline: "Transit, dédouanement et comptes clients",
  /** Shorter line when space is tight */
  taglineShort: "Opérations transit",
  /** Root layout & OG-style description */
  description:
    "Plateforme opérationnelle pour le dédouanement, les dossiers et la comptabilité clients.",
} as const;

/** Decorative hub codes on login (not tied to a geography). */
export const productBrandSceneHubs = ["T1", "T2", "T3"] as const;

export function productPageTitle(segment?: string): string {
  return segment ? `${segment} — ${productBrand.name}` : productBrand.name;
}
