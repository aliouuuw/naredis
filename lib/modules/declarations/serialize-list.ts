import type { DeclarationListItem } from "./service";

/** Client-safe row (no BigInt) for tables and client components. */
export type DeclarationListItemSerialized = Omit<
  DeclarationListItem,
  "clientAmountPaid" | "gaindeDutyAmount" | "costPrice" | "createdAt"
> & {
  clientAmountPaid: string | null;
  gaindeDutyAmount: string | null;
  costPrice: string | null;
  createdAt: string;
};

export function serializeDeclarationListItem(
  row: DeclarationListItem,
): DeclarationListItemSerialized {
  return {
    ...row,
    clientAmountPaid: row.clientAmountPaid?.toString() ?? null,
    gaindeDutyAmount: row.gaindeDutyAmount?.toString() ?? null,
    costPrice: row.costPrice?.toString() ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}
