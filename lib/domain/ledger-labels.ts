export type LedgerEntryType =
  | "versement"
  | "charge"
  | "opening_balance"
  | "reversal";

export function formatLedgerEntryType(entryType: LedgerEntryType): string {
  const labels: Record<LedgerEntryType, string> = {
    versement: "Versement",
    charge: "Charge",
    opening_balance: "Solde d'ouverture",
    reversal: "Contre-passation",
  };
  return labels[entryType];
}
