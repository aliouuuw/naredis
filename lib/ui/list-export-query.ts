/** Query keys stripped before list Excel export (UI-only). */
const OMIT_FOR_LIST_EXPORT = ["page", "open", "new", "record"] as const;

/** Preserves repeated keys (e.g. transaction filters `f`). */
export function searchParamsToRecord(
  params: URLSearchParams,
): Record<string, string | string[] | undefined> {
  const record: Record<string, string | string[] | undefined> = {};
  for (const key of new Set(params.keys())) {
    const values = params.getAll(key);
    record[key] = values.length > 1 ? values : values[0];
  }
  return record;
}

export function listExportQueryString(
  searchParams: URLSearchParams,
): string {
  const sp = new URLSearchParams(searchParams.toString());
  for (const key of OMIT_FOR_LIST_EXPORT) {
    sp.delete(key);
  }
  return sp.toString();
}

export function listExportUrl(
  apiPath: "/api/declarations/export" | "/api/transactions/export",
  searchParams: URLSearchParams,
): string {
  const qs = listExportQueryString(searchParams);
  return qs ? `${apiPath}?${qs}` : apiPath;
}
