"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  clearTableColumnPrefs,
  defaultTableColumnPrefs,
  normalizeTableColumnPrefs,
  readTableColumnPrefs,
  resolveVisibleColumns,
  writeTableColumnPrefs,
  type TableColumnDef,
  type TableColumnPrefs,
} from "@/lib/ui/table-columns";

export function useTableColumns(
  tableId: string,
  definition: readonly TableColumnDef[],
) {
  const [prefs, setPrefs] = useState<TableColumnPrefs | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setPrefs(readTableColumnPrefs(tableId));
    setReady(true);
  }, [tableId]);

  const normalizedPrefs = useMemo(
    () => normalizeTableColumnPrefs(definition, prefs),
    [definition, prefs],
  );

  const visibleColumns = useMemo(
    () => resolveVisibleColumns(definition, prefs),
    [definition, prefs],
  );

  const visibleIds = useMemo(
    () => visibleColumns.map((c) => c.id),
    [visibleColumns],
  );

  const updatePrefs = useCallback(
    (next: TableColumnPrefs) => {
      const normalized = normalizeTableColumnPrefs(definition, next);
      writeTableColumnPrefs(tableId, normalized);
      setPrefs(normalized);
    },
    [definition, tableId],
  );

  const resetPrefs = useCallback(() => {
    clearTableColumnPrefs(tableId);
    setPrefs(null);
  }, [tableId]);

  return {
    ready,
    visibleColumns,
    visibleIds,
    prefs: normalizedPrefs,
    updatePrefs,
    resetPrefs,
    definition,
    defaults: defaultTableColumnPrefs(definition),
  };
}
