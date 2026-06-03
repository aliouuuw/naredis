import { declarationFieldLabel } from "./declaration-fields";

const COMPLETION_FIELD_LABELS: Record<string, string> = {
  zoneOrTerminal: "Zone / terminal",
  declarationDate: "Date de déclaration",
  blReference: "Numéro BL",
  containerCount: "Nombre de conteneurs",
  containers: "Numéros de conteneurs",
  clientAmountPaid: "Montant client",
  gaindeDutyAmount: "Droit GAINDE",
  costPrice: "Prix de revient",
};

export function formatBonADelivrerError(missing: string[]): string {
  if (missing.length === 0) {
    return "Impossible de cocher bon à délivrer.";
  }
  const labels = missing.map(
    (k) => COMPLETION_FIELD_LABELS[k] ?? declarationFieldLabel(k),
  );
  return `Bon à délivrer : renseignez ${labels.join(", ")}.`;
}
