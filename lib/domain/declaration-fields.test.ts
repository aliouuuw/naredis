import { describe, expect, it } from "bun:test";
import { formatEditLogValue } from "./declaration-fields";

describe("formatEditLogValue", () => {
  it("resolves paying agency id to name", () => {
    expect(
      formatEditLogValue("paying_agency_id", "uuid-1", {
        agencyNameById: { "uuid-1": "Agence principale" },
      }),
    ).toBe("Agence principale");
  });

  it("shows em dash for unknown agency id", () => {
    expect(formatEditLogValue("paying_agency_id", "missing-id", {})).toBe("—");
  });
});
