import { describe, expect, test } from "bun:test";
import {
  activeFilterRules,
  agencyDateRangeForPreset,
  buildGroupTree,
  parseTransactionsViewState,
  rulesToLedgerFilters,
  serializeTransactionsSearchParams,
  sortLedgerRows,
} from "./transactions-query";
import type { LedgerEntrySerialized } from "./serialize";

const sampleRow = (
  overrides: Partial<LedgerEntrySerialized> = {},
): LedgerEntrySerialized => ({
  id: "1",
  customerId: "c1",
  customerName: "Alpha",
  transactionTypeId: "t1",
  transactionTypeName: "Versement",
  entryType: "versement",
  balanceSide: "credit",
  amount: "1000",
  label: "Test",
  notes: null,
  effectiveDate: "2026-06-01",
  category: null,
  dossierId: null,
  dossierNumber: null,
  declarationId: null,
  createdAt: new Date("2026-06-01T10:00:00.000Z"),
  allocations: [],
  ...overrides,
});

describe("parseTransactionsViewState", () => {
  test("parses legacy customer param and filter tokens", () => {
    const state = parseTransactionsViewState(
      {
        customer: "cust-1",
        f: ["side:eq:credit", "q:contains:facture"],
        group: "month,client",
        sort: "amount-desc",
        preset: "week",
      },
      "2026-06-03",
    );

    expect(state.rules.some((r) => r.field === "customer" && r.value === "cust-1")).toBe(
      true,
    );
    expect(state.rules.some((r) => r.field === "side")).toBe(true);
    expect(state.groupBy).toEqual(["month", "client"]);
    expect(state.sort).toBe("amount-desc");
    expect(state.datePreset).toBe("week");
  });
});

describe("rulesToLedgerFilters", () => {
  test("ignores incomplete rules", () => {
    const filters = rulesToLedgerFilters(
      activeFilterRules([
        { id: "1", field: "customer", operator: "eq", value: "" },
        { id: "2", field: "side", operator: "eq", value: "debit" },
      ]),
      "2026-01-01",
      "2026-06-03",
    );
    expect(filters.customerId).toBeUndefined();
    expect(filters.balanceSide).toBe("debit");
    expect(filters.dateFrom).toBe("2026-01-01");
  });
});

describe("buildGroupTree", () => {
  test("nests multiple dimensions", () => {
    const rows = [
      sampleRow({ id: "1", effectiveDate: "2026-06-01", customerName: "A" }),
      sampleRow({ id: "2", effectiveDate: "2026-06-01", customerName: "B" }),
      sampleRow({ id: "3", effectiveDate: "2026-06-02", customerName: "A" }),
    ];
    const tree = buildGroupTree(rows, ["day", "client"]);
    expect(tree.length).toBe(2);
    const firstDay = tree.find((n) => n.label === "2026-06-02");
    expect(firstDay?.children?.length).toBe(1);
  });
});

describe("serializeTransactionsSearchParams", () => {
  test("round-trips filter rules in URL", () => {
    const state = parseTransactionsViewState(
      { f: "side:eq:debit", preset: "today" },
      "2026-06-03",
    );
    const qs = serializeTransactionsSearchParams(state).toString();
    expect(qs).toContain("f=side%3Aeq%3Adebit");
    expect(qs).toContain("preset=today");
  });

  test("preset=all is preserved (no implicit fallback to today)", () => {
    const today = "2026-06-03";
    const initial = parseTransactionsViewState({ preset: "all", group: "client" }, today);
    expect(initial.datePreset).toBe("all");
    expect(initial.dateFrom).toBe("");
    expect(initial.dateTo).toBe("");

    const qs = serializeTransactionsSearchParams(initial).toString();
    expect(qs).toContain("preset=all");

    const roundTrip = parseTransactionsViewState(
      Object.fromEntries(new URLSearchParams(qs)),
      today,
    );
    expect(roundTrip.datePreset).toBe("all");
    expect(roundTrip.groupBy).toEqual(["client"]);
  });
});

describe("agencyDateRangeForPreset", () => {
  test("today uses same from and to", () => {
    const r = agencyDateRangeForPreset("today", "2026-06-03");
    expect(r).toEqual({ dateFrom: "2026-06-03", dateTo: "2026-06-03" });
  });
});

describe("sortLedgerRows", () => {
  test("sorts by amount descending", () => {
    const sorted = sortLedgerRows(
      [
        sampleRow({ id: "a", amount: "100" }),
        sampleRow({ id: "b", amount: "500" }),
      ],
      "amount-desc",
    );
    expect(sorted[0].id).toBe("b");
  });
});
