import { describe, expect, test } from "bun:test";
import { recordVersementBodySchema } from "./schemas";

describe("recordVersementBodySchema", () => {
  test("parses body without customerId", () => {
    const parsed = recordVersementBodySchema.safeParse({
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

  test("strips customerId from body (action binds it separately)", () => {
    const parsed = recordVersementBodySchema.safeParse({
      customerId: "00000000-0000-4000-8000-000000000099",
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
