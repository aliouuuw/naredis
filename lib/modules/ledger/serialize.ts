import type { LedgerEntryListItem } from "./service";
import type { TransactionTypeRow } from "./transaction-types";

export type LedgerEntrySerialized = Omit<
  LedgerEntryListItem,
  "amount" | "allocations"
> & {
  amount: string;
  allocations: Array<
    Omit<LedgerEntryListItem["allocations"][number], "amount"> & {
      amount: string;
    }
  >;
};

export type TransactionTypeSerialized = TransactionTypeRow;

export function serializeLedgerEntry(
  row: LedgerEntryListItem,
): LedgerEntrySerialized {
  return {
    ...row,
    amount: row.amount.toString(),
    allocations: row.allocations.map((a) => ({
      ...a,
      amount: a.amount.toString(),
    })),
  };
}
