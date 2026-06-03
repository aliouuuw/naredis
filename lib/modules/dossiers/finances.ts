import type { BalanceSide } from "@/lib/db/enums";
import type { LedgerEntryListItem } from "@/lib/modules/ledger/service";

export type DossierLedgerSummary = {
  charges: bigint;
  paye: bigint;
  /** Amount still owed on this dossier (charges − payé, minimum 0). */
  reste: bigint;
  /** When payé exceeds charges, surplus credited to the dossier. */
  surplus: bigint;
};

/** Attribute ledger lines to a dossier (direct link or payment allocation). */
export function amountAttributedToDossier(
  entry: LedgerEntryListItem,
  dossierId: string,
): bigint {
  if (entry.dossierId === dossierId) {
    return entry.amount;
  }
  let total = BigInt(0);
  for (const line of entry.allocations) {
    if (line.dossierId === dossierId) {
      total += line.amount;
    }
  }
  return total;
}

export function computeDossierLedgerSummary(
  entries: LedgerEntryListItem[],
  dossierId: string,
): DossierLedgerSummary {
  let charges = BigInt(0);
  let paye = BigInt(0);

  for (const entry of entries) {
    const attributed = amountAttributedToDossier(entry, dossierId);
    if (attributed === BigInt(0)) continue;

    if (entry.balanceSide === "debit") {
      charges += attributed;
    } else {
      paye += attributed;
    }
  }

  const net = charges - paye;
  return {
    charges,
    paye,
    reste: net > BigInt(0) ? net : BigInt(0),
    surplus: net < BigInt(0) ? -net : BigInt(0),
  };
}

export function dossierResteLabel(summary: DossierLedgerSummary): {
  amount: bigint;
  side: BalanceSide | "settled";
} {
  if (summary.reste > BigInt(0)) {
    return { amount: summary.reste, side: "debit" };
  }
  if (summary.surplus > BigInt(0)) {
    return { amount: summary.surplus, side: "credit" };
  }
  return { amount: BigInt(0), side: "settled" };
}
