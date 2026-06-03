import { describe, expect, test } from "bun:test";
import {
  defaultTableColumnPrefs,
  moveColumnInPrefs,
  normalizeTableColumnPrefs,
  resolveVisibleColumns,
  type TableColumnDef,
} from "./table-columns";

const DEFS: TableColumnDef[] = [
  { id: "a", label: "A" },
  { id: "b", label: "B" },
  { id: "c", label: "C", defaultHidden: true },
  { id: "actions", label: "Actions", pinnedEnd: true, required: true },
];

describe("table-columns", () => {
  test("default hides optional columns", () => {
    expect(defaultTableColumnPrefs(DEFS).hidden).toEqual(["c"]);
  });

  test("resolveVisibleColumns respects order and hidden", () => {
    const visible = resolveVisibleColumns(DEFS, {
      order: ["b", "a", "c"],
      hidden: ["a"],
    });
    expect(visible.map((c) => c.id)).toEqual(["b", "c", "actions"]);
  });

  test("normalize appends new column ids", () => {
    const normalized = normalizeTableColumnPrefs(DEFS, {
      order: ["b"],
      hidden: [],
    });
    expect(normalized.order).toEqual(["b", "a", "c"]);
  });

  test("moveColumnInPrefs", () => {
    const prefs = defaultTableColumnPrefs(DEFS);
    const moved = moveColumnInPrefs(prefs, "b", "up");
    expect(moved.order.indexOf("b")).toBe(0);
  });
});
