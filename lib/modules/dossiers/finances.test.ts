import { describe, expect, test } from "bun:test";
import {
  amountAttributedToDossier,
  computeDossierLedgerSummary,
} from "./finances";
import type { LedgerEntryListItem } from "@/lib/modules/ledger/service";

function entry(
  partial: Partial<LedgerEntryListItem> & Pick<LedgerEntryListItem, "id" | "balanceSide" | "amount">,
): LedgerEntryListItem {
  return {
    customerId: "c1",
    customerName: "Test",
    transactionTypeId: null,
    transactionTypeName: "Test",
    entryType: partial.balanceSide === "debit" ? "charge" : "versement",
    label: "Line",
    notes: null,
    effectiveDate: "2026-06-01",
    category: null,
    dossierId: null,
    dossierNumber: null,
    declarationId: null,
    reversesEntryId: null,
    reversedByEntryId: null,
    canReverse: false,
    createdAt: new Date(),
    allocations: [],
    ...partial,
  };
}

describe("computeDossierLedgerSummary", () => {
  const dossierId = "d1";

  test("sums charge on dossier and versement via allocation", () => {
    const rows = [
      entry({
        id: "e1",
        balanceSide: "debit",
        amount: BigInt(410_000),
        dossierId,
      }),
      entry({
        id: "e2",
        balanceSide: "credit",
        amount: BigInt(100_000),
        allocations: [
          {
            id: "a1",
            dossierId,
            dossierNumber: "D-1",
            blReference: null,
            amount: BigInt(50_000),
          },
        ],
      }),
    ];

    const summary = computeDossierLedgerSummary(rows, dossierId);
    expect(summary.charges).toBe(BigInt(410_000));
    expect(summary.paye).toBe(BigInt(50_000));
    expect(summary.reste).toBe(BigInt(360_000));
    expect(summary.surplus).toBe(BigInt(0));
  });

  test("ignores unrelated dossier allocations", () => {
    const rows = [
      entry({
        id: "e1",
        balanceSide: "credit",
        amount: BigInt(100_000),
        allocations: [
          {
            id: "a1",
            dossierId: "other",
            dossierNumber: "D-2",
            blReference: null,
            amount: BigInt(100_000),
          },
        ],
      }),
    ];

    expect(computeDossierLedgerSummary(rows, dossierId).charges).toBe(BigInt(0));
    expect(amountAttributedToDossier(rows[0]!, dossierId)).toBe(BigInt(0));
  });
});
