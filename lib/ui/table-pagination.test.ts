import { describe, expect, test } from "bun:test";
import {
  paginateSlice,
  parseTablePage,
  totalTablePages,
} from "./table-pagination";

describe("table-pagination", () => {
  test("parseTablePage", () => {
    expect(parseTablePage(null)).toBe(1);
    expect(parseTablePage("2")).toBe(2);
    expect(parseTablePage("0")).toBe(1);
    expect(parseTablePage("x")).toBe(1);
  });

  test("paginateSlice", () => {
    const items = Array.from({ length: 25 }, (_, i) => i);
    const page1 = paginateSlice(items, 1);
    expect(page1.items).toHaveLength(20);
    expect(page1.page).toBe(1);
    expect(page1.totalPages).toBe(2);

    const page2 = paginateSlice(items, 2);
    expect(page2.items).toHaveLength(5);
    expect(totalTablePages(20)).toBe(1);
    expect(totalTablePages(21)).toBe(2);
  });
});
