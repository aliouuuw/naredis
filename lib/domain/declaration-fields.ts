/** French labels for declaration_edit_log field keys. */
export const DECLARATION_FIELD_LABELS: Record<string, string> = {
  zone_or_terminal: "Zone / terminal",
  declaration_date: "Date de déclaration",
  container_count: "Nombre de conteneurs",
  containers: "Numéros de conteneurs",
  client_amount_paid: "Montant client",
  gainde_duty_amount: "Droit GAINDE",
  cost_price: "Prix de revient",
  reste: "Reste (marge)",
  paying_agency_id: "Maison-mère",
  bl_reference: "Numéro BL",
  customs_reference: "N° douane",
  bureau: "Bureau",
  bon_a_delivrer: "Bon à délivrer",
};

export function declarationFieldLabel(key: string): string {
  return DECLARATION_FIELD_LABELS[key] ?? key;
}

export type EditLogDisplayContext = {
  agencyNameById?: Record<string, string>;
};

/** Format stored edit-log values for display. */
export function formatEditLogValue(
  key: string,
  value: string | null,
  context?: EditLogDisplayContext,
): string {
  if (value == null || value === "") return "—";

  if (key === "paying_agency_id") {
    const name = context?.agencyNameById?.[value];
    return name ?? "—";
  }

  if (key === "bon_a_delivrer") {
    return value === "true" ? "Oui" : "Non";
  }

  if (key === "containers") {
    try {
      const parsed = JSON.parse(value) as string[];
      if (Array.isArray(parsed)) {
        return parsed.length > 0 ? parsed.join(", ") : "—";
      }
    } catch {
      return value;
    }
  }

  if (
    key === "client_amount_paid" ||
    key === "gainde_duty_amount" ||
    key === "cost_price"
  ) {
    try {
      return `${BigInt(value).toLocaleString("fr-FR")} XOF`;
    } catch {
      return value;
    }
  }

  return value;
}
