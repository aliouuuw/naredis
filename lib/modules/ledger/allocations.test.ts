import { describe, expect, test } from "bun:test";
import {
  AllocationValidationError,
  sumAllocations,
  validateVersementAllocations,
} from "./allocations";

describe("validateVersementAllocations", () => {
  test("allows empty allocations", () => {
    expect(() => validateVersementAllocations(BigInt(100), [])).not.toThrow();
  });

  test("allows partial allocation", () => {
    expect(() =>
      validateVersementAllocations(BigInt(100), [
        { dossierId: "a", amount: BigInt(40) },
      ]),
    ).not.toThrow();
  });

  test("rejects sum above entry amount", () => {
    expect(() =>
      validateVersementAllocations(BigInt(100), [
        { dossierId: "a", amount: BigInt(60) },
        { dossierId: "b", amount: BigInt(50) },
      ]),
    ).toThrow(AllocationValidationError);
  });

  test("rejects duplicate dossier ids", () => {
    expect(() =>
      validateVersementAllocations(BigInt(100), [
        { dossierId: "a", amount: BigInt(30) },
        { dossierId: "a", amount: BigInt(20) },
      ]),
    ).toThrow(AllocationValidationError);
  });
});

describe("sumAllocations", () => {
  test("sums line amounts", () => {
    expect(
      sumAllocations([
        { dossierId: "a", amount: BigInt(10) },
        { dossierId: "b", amount: BigInt(25) },
      ]),
    ).toBe(BigInt(35));
  });
});
