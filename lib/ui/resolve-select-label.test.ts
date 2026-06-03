import { describe, expect, test } from "bun:test";
import {
  looksLikeOpaqueId,
  resolveSelectDisplayText,
} from "./resolve-select-label";

describe("resolve-select-label", () => {
  test("looksLikeOpaqueId", () => {
    expect(looksLikeOpaqueId("550e8400-e29b-41d4-a716-446655440000")).toBe(true);
    expect(looksLikeOpaqueId("date-desc")).toBe(false);
  });

  test("resolveSelectDisplayText uses label", () => {
    expect(
      resolveSelectDisplayText("a", [{ value: "a", label: "Alpha" }]),
    ).toBe("Alpha");
  });

  test("resolveSelectDisplayText hides unknown uuid", () => {
    expect(
      resolveSelectDisplayText(
        "550e8400-e29b-41d4-a716-446655440000",
        [],
        { placeholder: "Choisir…" },
      ),
    ).toBe("Choisir…");
  });
});
