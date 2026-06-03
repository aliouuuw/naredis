/** Default page size for operational list tables. */
export const TABLE_PAGE_SIZE = 20;

export function parseTablePage(raw: string | null | undefined): number {
  const n = Number.parseInt(raw ?? "1", 10);
  return Number.isFinite(n) && n >= 1 ? n : 1;
}

export function totalTablePages(
  itemCount: number,
  pageSize = TABLE_PAGE_SIZE,
): number {
  if (itemCount <= 0) return 1;
  return Math.ceil(itemCount / pageSize);
}

export function clampTablePage(page: number, itemCount: number, pageSize = TABLE_PAGE_SIZE): number {
  return Math.min(parseTablePage(String(page)), totalTablePages(itemCount, pageSize));
}

export function paginateSlice<T>(
  items: readonly T[],
  page: number,
  pageSize = TABLE_PAGE_SIZE,
): { items: T[]; page: number; totalPages: number } {
  const totalPages = totalTablePages(items.length, pageSize);
  const safePage = clampTablePage(page, items.length, pageSize);
  const start = (safePage - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    page: safePage,
    totalPages,
  };
}
