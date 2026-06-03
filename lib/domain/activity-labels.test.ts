import { describe, expect, it } from "bun:test";
import {
  activityActionLabel,
  formatActivityDetail,
} from "./activity-labels";

describe("activity-labels", () => {
  it("labels known declaration actions", () => {
    expect(activityActionLabel("declaration.created")).toBe("Déclaration créée");
  });

  it("formats declaration.updated payload", () => {
    expect(
      formatActivityDetail("declaration.updated", {
        changes: ["bon_a_delivrer", "client_amount_paid"],
      }),
    ).toContain("bon_a_delivrer");
  });
});
