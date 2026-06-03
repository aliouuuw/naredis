import { describe, expect, it } from "bun:test";
import { buildAccountLedger } from "./account-ledger";
import type { DeclarationListItemSerialized } from "@/lib/modules/declarations/serialize-list";
import type { LedgerEntrySerialized } from "@/lib/modules/ledger/serialize";

const ledgerRow = (
  overrides: Partial<LedgerEntrySerialized> = {},
): LedgerEntrySerialized => ({
  id: "l1",
  customerId: "c1",
  customerName: "Client A",
  transactionTypeId: "t1",
  transactionTypeName: "Versement",
  entryType: "versement",
  balanceSide: "credit",
  amount: "50000",
  label: "Acompte",
  notes: null,
  effectiveDate: "2026-06-01",
  category: null,
  dossierId: null,
  dossierNumber: null,
  declarationId: null,
  createdAt: "2026-06-01T10:00:00.000Z",
  allocations: [],
  ...overrides,
});

const declarationRow = (
  overrides: Partial<DeclarationListItemSerialized> = {},
): DeclarationListItemSerialized => ({
  id: "d1",
  declarationNumber: "1-18N-D001",
  zoneOrTerminal: "18N",
  declarationDate: "2026-06-02",
  blReference: "BL-1",
  customerName: "Client A",
  customerSlug: "client-a",
  containerCount: 1,
  clientAmountPaid: "100000",
  gaindeDutyAmount: "20000",
  costPrice: "70000",
  bonADelivrer: false,
  payingAgencyName: null,
  dossierId: "dos1",
  dossierNumber: "D-2026-0001",
  createdAt: "2026-06-02T08:00:00.000Z",
  ...overrides,
});

describe("buildAccountLedger", () => {
  it("groups by day and computes running balance after ledger entries", () => {
    const days = buildAccountLedger(
      [ledgerRow({ effectiveDate: "2026-06-01", amount: "50000" })],
      [declarationRow({ declarationDate: "2026-06-02" })],
    );

    expect(days.length).toBe(2);
    const june2 = days.find((d) => d.dayKey === "2026-06-02");
    expect(june2?.rows[0]?.kind).toBe("declaration");
    expect(june2?.rows[0]?.runningBalance.amount).toBe("50000");

    const june1 = days.find((d) => d.dayKey === "2026-06-01");
    expect(june1?.rows[0]?.runningBalance.amount).toBe("50000");
    expect(june1?.rows[0]?.runningBalance.side).toBe("credit");
  });
});
