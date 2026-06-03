import { describe, expect, test } from "bun:test";
import { flattenAccountLedgerForExport } from "./account-statement-export";
import type { AccountLedgerDayGroup } from "./account-ledger";

describe("account-statement-export", () => {
  test("flattenAccountLedgerForExport orders oldest first", () => {
    const groups: AccountLedgerDayGroup[] = [
      {
        dayKey: "2026-06-02",
        dayLabel: "2 juin",
        rows: [
          {
            id: "b",
            kind: "ledger",
            occurredAt: "",
            dayKey: "2026-06-02",
            dateDisplay: "02/06/2026",
            label: "B",
            detail: null,
            links: [],
            debitDisplay: null,
            creditDisplay: "100",
            href: "/",
            affectsBalance: true,
            runningBalance: { amount: "100", side: "credit" },
          },
        ],
      },
      {
        dayKey: "2026-06-01",
        dayLabel: "1 juin",
        rows: [
          {
            id: "a",
            kind: "ledger",
            occurredAt: "",
            dayKey: "2026-06-01",
            dateDisplay: "01/06/2026",
            label: "A",
            detail: null,
            links: [],
            debitDisplay: "50",
            creditDisplay: null,
            href: "/",
            affectsBalance: true,
            runningBalance: { amount: "50", side: "debit" },
          },
        ],
      },
    ];

    const flat = flattenAccountLedgerForExport(groups);
    expect(flat.map((r) => r.id)).toEqual(["a", "b"]);
  });
});
