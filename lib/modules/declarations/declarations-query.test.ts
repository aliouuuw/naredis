import { describe, expect, it } from "bun:test";
import {
  applyDeclarationClientFilters,
  parseDeclarationsViewState,
  serializeDeclarationsSearchParams,
  sumDeclarationLedgerTotals,
  viewStateToListFilters,
} from "./declarations-query";
import type { DeclarationListItemSerialized } from "./serialize-list";

describe("parseDeclarationsViewState", () => {
  it("maps view preset to BAD filter", () => {
    const pending = parseDeclarationsViewState({ view: "pending" }, "2026-06-03");
    expect(viewStateToListFilters(pending).bonADelivrer).toBe(false);

    const closed = parseDeclarationsViewState({ view: "closed" }, "2026-06-03");
    expect(viewStateToListFilters(closed).bonADelivrer).toBe(true);
  });

  it("zone tab applies zone filter and ledger totals", () => {
    const state = parseDeclarationsViewState(
      { tab: "zone:10S" },
      "2026-06-03",
    );
    expect(state.activeTab).toEqual({ kind: "zone", slug: "10S" });
    expect(state.showLedgerTotals).toBe(true);
    expect(viewStateToListFilters(state).zoneOrTerminal).toBe("10S");
  });

  it("round-trips filter rules", () => {
    const state = parseDeclarationsViewState(
      {
        view: "pending",
        f: [
          "customer:eq:550e8400-e29b-41d4-a716-446655440000",
          "zone:eq:18N",
          "q:contains:D001",
        ],
        sort: "amount-desc",
        group: "zone,client",
      },
      "2026-06-03",
    );
    const sp = serializeDeclarationsSearchParams(state);
    expect(sp.get("view")).toBe("pending");
    expect(sp.getAll("f")).toContain("zone:eq:18N");
    expect(sp.get("group")).toBe("zone,client");
  });
});

describe("applyDeclarationClientFilters", () => {
  const row = {
    id: "1",
    clientAmountPaid: "1000000",
    gaindeDutyAmount: "500000",
    costPrice: "800000",
    payingAgencyId: "a1",
    zoneOrTerminal: "10S",
    bonADelivrer: false,
  } as DeclarationListItemSerialized;

  it("filters by amount min", () => {
    const filtered = applyDeclarationClientFilters([row], [
      {
        id: "1",
        field: "amountMin",
        operator: "gte",
        value: "2000000",
      },
    ]);
    expect(filtered).toHaveLength(0);
  });
});

describe("sumDeclarationLedgerTotals", () => {
  it("sums montant and gainde", () => {
    const totals = sumDeclarationLedgerTotals([
      {
        clientAmountPaid: "1000",
        gaindeDutyAmount: "200",
        costPrice: "500",
      } as DeclarationListItemSerialized,
      {
        clientAmountPaid: "3000",
        gaindeDutyAmount: "400",
        costPrice: "1000",
      } as DeclarationListItemSerialized,
    ]);
    expect(totals.clientAmountPaid).toBe(4000n);
    expect(totals.gaindeDutyAmount).toBe(600n);
    expect(totals.reste).toBe(2500n);
  });
});
