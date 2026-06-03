import { describe, expect, it } from "bun:test";
import {
  parseDeclarationsViewState,
  serializeDeclarationsSearchParams,
  viewStateToListFilters,
} from "./declarations-query";

describe("parseDeclarationsViewState", () => {
  it("maps view preset to BAD filter", () => {
    const pending = parseDeclarationsViewState({ view: "pending" }, "2026-06-03");
    expect(viewStateToListFilters(pending).bonADelivrer).toBe(false);

    const closed = parseDeclarationsViewState({ view: "closed" }, "2026-06-03");
    expect(viewStateToListFilters(closed).bonADelivrer).toBe(true);
  });

  it("round-trips search params", () => {
    const state = parseDeclarationsViewState(
      {
        view: "pending",
        customer: "550e8400-e29b-41d4-a716-446655440000",
        zone: "18N",
        q: "D001",
        sort: "amount-desc",
      },
      "2026-06-03",
    );
    const sp = serializeDeclarationsSearchParams(state);
    expect(sp.get("view")).toBe("pending");
    expect(sp.get("zone")).toBe("18N");
    expect(sp.get("q")).toBe("D001");
  });
});
