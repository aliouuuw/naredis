import { describe, expect, it } from "bun:test";
import {
  canSetBonADelivrer,
  getBonADelivrerMissingFields,
} from "./declaration-completion";

const complete = {
  zoneOrTerminal: "DPW",
  declarationDate: "2026-05-23",
  blReference: "BL-001",
  containerCount: 1,
  containers: ["ABCD1234567"],
  clientAmountPaid: BigInt(1000),
  gaindeDutyAmount: BigInt(500),
  costPrice: BigInt(400),
};

describe("bon à délivrer completion", () => {
  it("allows BAD when every required field is set", () => {
    expect(canSetBonADelivrer(complete)).toBe(true);
    expect(getBonADelivrerMissingFields(complete)).toEqual([]);
  });

  it("flags missing container numbers", () => {
    const missing = getBonADelivrerMissingFields({
      ...complete,
      containerCount: 2,
      containers: ["ABCD1234567"],
    });
    expect(missing).toContain("containers");
  });

  it("flags blank zone and money fields", () => {
    const missing = getBonADelivrerMissingFields({
      ...complete,
      zoneOrTerminal: "  ",
      clientAmountPaid: null,
    });
    expect(missing).toContain("zoneOrTerminal");
    expect(missing).toContain("clientAmountPaid");
  });
});
