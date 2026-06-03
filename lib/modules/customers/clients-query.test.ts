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
  test("parseClientsViewState", () => {
    const state = parseClientsViewState({
      q: "alpha",
      sort: "balance-desc",
      status: "pas_a_jour",
    });
    expect(state.search).toBe("alpha");
    expect(state.sort).toBe("balance-desc");
    expect(state.accountStatus).toBe("pas_a_jour");
  });

  test("filterAndSortClients", () => {
    const filtered = filterAndSortClients(sample, {
      search: "alpha",
      sort: "name-asc",
      accountStatus: "",
    });
    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.name).toBe("Alpha");
  });
});
