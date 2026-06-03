import type { BalanceSide } from "@/lib/db/enums";
import { formatXof } from "@/lib/domain/balance";
import { cn } from "@/lib/utils";

/** Shared chrome for client relevé and transactions tables. */
export const ledgerTable = {
  wrapper: "overflow-hidden rounded-lg border bg-card",
  scroll: "overflow-x-auto",
  table: "w-full border-collapse text-sm",
  theadRow: "border-b bg-muted/50",
  th: "px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground",
  thRight:
    "px-3 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wide text-muted-foreground",
  td: "px-3 py-2.5 align-top text-sm",
  tdDate: "px-3 py-2.5 align-top text-sm tabular-nums text-muted-foreground",
  amountCell: "px-3 py-2.5 align-top text-sm tabular-nums text-right whitespace-nowrap",
  footer:
    "border-t bg-muted/20 px-4 py-2 text-[11px] leading-snug text-muted-foreground",
  dayHeaderRow: "border-b bg-muted/30",
  dayHeaderCell:
    "px-3 py-2 text-xs font-semibold capitalize tracking-wide text-foreground",
  bodyRow:
    "border-b border-border/60 transition-colors hover:bg-muted/20",
  declarationRow: "bg-muted/10",
  link: "font-medium text-primary hover:underline",
  labelLink: "font-medium hover:underline",
  detail: "text-xs text-muted-foreground",
} as const;

export const debitAmountClass =
  "font-medium text-amber-800 dark:text-amber-300";

export const creditAmountClass =
  "font-medium text-emerald-800 dark:text-emerald-400";

export const mutedDashClass = "text-muted-foreground/50";

export function balanceSideAmountClass(
  side: BalanceSide,
  amount: bigint,
): string {
  if (amount === BigInt(0)) return "text-muted-foreground";
  return side === "debit" ? debitAmountClass : creditAmountClass;
}

export function formatDebitCreditCells(
  amount: bigint,
  side: BalanceSide,
): { debit: string | null; credit: string | null } {
  const formatted = `${formatXof(amount)} XOF`;
  if (side === "debit") {
    return { debit: formatted, credit: null };
  }
  return { debit: null, credit: formatted };
}

export function ledgerSectionCopy() {
  return {
    title: "Écritures du compte",
    description:
      "Mouvements débit et crédit du compte client. Les lignes déclaration (onglet Résumé) sont informatives et ne modifient pas le solde.",
    transactionsDescription:
      "Historique des écritures enregistrées pour ce client. Débit = charge au client ; crédit = versement ou avoir.",
    footerResume:
      "Les lignes déclaration sont informatives (fiche BL) et ne mouvementent pas le solde. Solde = cumul des écritures débit / crédit.",
    footerTransactions:
      "Débit en ambre, crédit en vert. Les affectations dossier précisent la répartition des versements.",
    legendDebit: "Débit — le client doit à l'agence",
    legendCredit: "Crédit — versement ou avoir client",
  } as const;
}

export function cnLedger(...classes: (string | false | null | undefined)[]) {
  return cn(...classes);
}
