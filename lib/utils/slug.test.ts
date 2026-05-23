import { describe, expect, it } from "bun:test";
import { slugFromName } from "./slug";

describe("slugFromName", () => {
  it("lowercases, strips accents and collapses separators", () => {
    expect(slugFromName("Société Générale")).toBe("societe-generale");
  });

  it("trims leading and trailing dashes", () => {
    expect(slugFromName("  --Acme--  ")).toBe("acme");
  });

  it("falls back to 'client' when nothing remains", () => {
    expect(slugFromName("///")).toBe("client");
    expect(slugFromName("")).toBe("client");
  });
});
