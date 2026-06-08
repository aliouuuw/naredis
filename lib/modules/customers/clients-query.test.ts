import { describe, expect, test } from "bun:test";
import {
  filterAndSortClients,
  parseClientsViewState,
} from "./clients-query";
import type { CustomerListItemSerialized } from "./serialize-list";

const sample: CustomerListItemSerialized[] = [
  {
    id: "1",
    name: "Beta",
    slug: "beta",
    phone: null,
    balanceAmount: "1000",
    balanceLabel: "débit",
    balanceSide: "debit",
    feesAllTime: "500",
    transactionsToday: "0",
    accountStatus: "a_jour",
  },
  {
    id: "2",
    name: "Alpha",
    slug: "alpha",
    phone: "77",
    balanceAmount: "2000",
    balanceLabel: "crédit",
    balanceSide: "credit",
    feesAllTime: "100",
    transactionsToday: "50",
    accountStatus: "pas_a_jour",
  },
];

describe("clients-query", () => {
  test("parseClientsViewState from rules", () => {
    const state = parseClientsViewState({
      f: ["q:contains:alpha", "accountStatus:eq:pas_a_jour"],
      sort: "balance-desc",
    });
    expect(state.rules).toHaveLength(2);
    expect(state.sort).toBe("balance-desc");
  });

  test("filterAndSortClients", () => {
    const filtered = filterAndSortClients(sample, {
      rules: [
        {
          id: "1",
          field: "q",
          operator: "contains",
          value: "alpha",
        },
      ],
      groupBy: [],
      sort: "name-asc",
    });
    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.name).toBe("Alpha");
  });
});
