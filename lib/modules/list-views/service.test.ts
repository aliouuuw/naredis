import { describe, expect, it } from "bun:test";
import { createListViewSchema } from "./schemas";

describe("createListViewSchema", () => {
  it("accepts valid page keys", () => {
    const parsed = createListViewSchema.safeParse({
      pageKey: "declarations",
      name: "Zone 10S",
      query: "tab=zone:10S&ledger=1",
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects empty name", () => {
    const parsed = createListViewSchema.safeParse({
      pageKey: "clients",
      name: "  ",
      query: "sort=name-asc",
    });
    expect(parsed.success).toBe(false);
  });
});
