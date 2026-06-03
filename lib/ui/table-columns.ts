export type TableColumnDef = {
  id: string;
  label: string;
  /** Cannot be hidden (still reorderable unless pinnedEnd). */
  required?: boolean;
  /** Fixed last column (e.g. actions). */
  pinnedEnd?: boolean;
  defaultHidden?: boolean;
};

export type TableColumnPrefs = {
  order: string[];
  hidden: string[];
};

const STORAGE_PREFIX = "naredis.tableColumns.v1";

export function tableColumnStorageKey(tableId: string): string {
  return `${STORAGE_PREFIX}.${tableId}`;
}

export function defaultTableColumnPrefs(defs: readonly TableColumnDef[]): TableColumnPrefs {
  const configurable = defs.filter((d) => !d.pinnedEnd);
  return {
    order: configurable.map((d) => d.id),
    hidden: configurable.filter((d) => d.defaultHidden).map((d) => d.id),
  };
}

export function readTableColumnPrefs(tableId: string): TableColumnPrefs | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(tableColumnStorageKey(tableId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as TableColumnPrefs;
    if (!Array.isArray(parsed.order) || !Array.isArray(parsed.hidden)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function writeTableColumnPrefs(tableId: string, prefs: TableColumnPrefs): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(tableColumnStorageKey(tableId), JSON.stringify(prefs));
}

export function clearTableColumnPrefs(tableId: string): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(tableColumnStorageKey(tableId));
}

/** Merge saved prefs with current column definitions (drops stale ids, appends new columns). */
export function normalizeTableColumnPrefs(
  defs: readonly TableColumnDef[],
  prefs: TableColumnPrefs | null,
): TableColumnPrefs {
  const defaults = defaultTableColumnPrefs(defs);
  if (!prefs) return defaults;

  const validIds = new Set(defs.filter((d) => !d.pinnedEnd).map((d) => d.id));
  const order = [
    ...prefs.order.filter((id) => validIds.has(id)),
    ...defaults.order.filter((id) => !prefs.order.includes(id)),
  ];
  const hidden = prefs.hidden.filter((id) => validIds.has(id));

  return { order, hidden };
}

export function resolveVisibleColumns(
  defs: readonly TableColumnDef[],
  prefs: TableColumnPrefs | null,
): TableColumnDef[] {
  const normalized = normalizeTableColumnPrefs(defs, prefs);
  const byId = new Map(defs.map((d) => [d.id, d]));
  const hidden = new Set(normalized.hidden);
  const pinned = defs.filter((d) => d.pinnedEnd);

  const visible = normalized.order
    .map((id) => byId.get(id))
    .filter((d): d is TableColumnDef => {
      if (!d || d.pinnedEnd) return false;
      if (d.required) return true;
      return !hidden.has(d.id);
    });

  return [...visible, ...pinned];
}

export function moveColumnInPrefs(
  prefs: TableColumnPrefs,
  columnId: string,
  direction: "up" | "down",
): TableColumnPrefs {
  const order = [...prefs.order];
  const index = order.indexOf(columnId);
  if (index < 0) return prefs;
  const swapWith = direction === "up" ? index - 1 : index + 1;
  if (swapWith < 0 || swapWith >= order.length) return prefs;
  [order[index], order[swapWith]] = [order[swapWith]!, order[index]!];
  return { ...prefs, order };
}

export function toggleColumnHidden(
  prefs: TableColumnPrefs,
  columnId: string,
  visible: boolean,
): TableColumnPrefs {
  const hidden = new Set(prefs.hidden);
  if (visible) {
    hidden.delete(columnId);
  } else {
    hidden.add(columnId);
  }
  return { ...prefs, hidden: [...hidden] };
}
