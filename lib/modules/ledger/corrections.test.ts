import { describe, expect, it } from "bun:test";
import { openingBalanceBodySchema, reverseLedgerEntryBodySchema } from "./schemas";

describe("openingBalanceBodySchema", () => {
  it("accepts debit opening balance", () => {
    const parsed = openingBalanceBodySchema.safeParse({
      amount: "1000",
      balanceSide: "debit",
      effectiveDate: "2026-01-01",
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects non-positive amount", () => {
    expect(() =>
      openingBalanceBodySchema.parse({
        amount: "0",
        balanceSide: "debit",
      }),
    ).toThrow();
  });
});

describe("reverseLedgerEntryBodySchema", () => {
  it("requires a reason", () => {
    const parsed = reverseLedgerEntryBodySchema.safeParse({ reason: "ab" });
    expect(parsed.success).toBe(false);
  });

  it("accepts valid reason", () => {
    const parsed = reverseLedgerEntryBodySchema.safeParse({
      reason: "Erreur de saisie",
    });
    expect(parsed.success).toBe(true);
  });
});
