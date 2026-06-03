import type { CustomerListItem } from "./service";

export type CustomerListItemSerialized = Omit<
  CustomerListItem,
  "balanceAmount" | "feesAllTime" | "transactionsToday"
> & {
  balanceAmount: string;
  feesAllTime: string;
  transactionsToday: string;
};

export function serializeCustomerListItem(
  row: CustomerListItem,
): CustomerListItemSerialized {
  return {
    ...row,
    balanceAmount: row.balanceAmount.toString(),
    feesAllTime: row.feesAllTime.toString(),
    transactionsToday: row.transactionsToday.toString(),
  };
}
