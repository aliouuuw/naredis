import { describe, expect, it } from "bun:test";
import {
  buildDeclarationNumber,
  parseDeclarationNumberParts,
} from "./declaration-number";

describe("buildDeclarationNumber", () => {
  it("formats pilot example 1-18N-D001", () => {
    expect(buildDeclarationNumber("1", "18N", "001")).toBe("1-18N-D001");
  });

  it("pads short suffix", () => {
    expect(buildDeclarationNumber("2", "DPW", "1")).toBe("2-DPW-D001");
  });

  it("strips leading D from suffix input", () => {
    expect(buildDeclarationNumber("1", "18N", "D001")).toBe("1-18N-D001");
  });
});

describe("parseDeclarationNumberParts", () => {
  it("parses pilot example", () => {
    expect(parseDeclarationNumberParts("1-18N-D001")).toEqual({
      prefix: "1",
      zone: "18N",
      suffix: "1",
    });
  });
});
