import { describe, expect, test } from "bun:test";
import { recordTransactionBodySchema } from "./schemas";

describe("recordTransactionBodySchema", () => {
  test("parses body without customerId", () => {
    const parsed = recordTransactionBodySchema.safeParse({
      transactionTypeId: "00000000-0000-4000-8000-000000000001",
      label: "Virement",
      amount: "1000",
      effectiveDate: "2026-06-03",
      allocations: [],
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.amount).toBe(BigInt(1000));
    }
  });

  test("strips customerId from body", () => {
    const parsed = recordTransactionBodySchema.safeParse({
      customerId: "00000000-0000-4000-8000-000000000099",
      transactionTypeId: "00000000-0000-4000-8000-000000000001",
      label: "Virement",
      amount: "1000",
      effectiveDate: "2026-06-03",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect("customerId" in parsed.data).toBe(false);
    }
  });
});
