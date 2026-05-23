import { describe, expect, it } from "bun:test";
import { balanceFromTotals, formatBalanceLabel } from "./balance";

describe("balanceFromTotals", () => {
  const z = BigInt(0);

  it("returns debit when client owes the agency", () => {
    expect(
      balanceFromTotals({ totalDebit: BigInt(1000), totalCredit: BigInt(400) }),
    ).toEqual({ amount: BigInt(600), side: "debit" });
  });

  it("returns credit when agency owes the client", () => {
    expect(
      balanceFromTotals({ totalDebit: BigInt(200), totalCredit: BigInt(800) }),
    ).toEqual({ amount: BigInt(600), side: "credit" });
  });

  it("returns zero debit for a settled account", () => {
    expect(
      balanceFromTotals({ totalDebit: BigInt(500), totalCredit: BigInt(500) }),
    ).toEqual({ amount: z, side: "debit" });
  });
});

describe("formatBalanceLabel", () => {
  it("maps balance sides to French labels", () => {
    expect(formatBalanceLabel("debit")).toBe("Débit");
    expect(formatBalanceLabel("credit")).toBe("Crédit");
  });
});
