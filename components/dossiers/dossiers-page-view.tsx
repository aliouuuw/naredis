"use client";

import { useMemo } from "react";
import type { DossierListItem } from "@/lib/modules/dossiers/service";
import { useTablePage } from "@/components/hooks/use-table-page";
import { TablePagination } from "@/components/ui/table-pagination";
import { paginateSlice } from "@/lib/ui/table-pagination";
import { DossiersTable } from "./dossiers-table";

export function DossiersPageView({ rows }: { rows: DossierListItem[] }) {
  const { page, setPage } = useTablePage();

  const { items: pagedRows, page: safePage } = useMemo(
    () => paginateSlice(rows, page),
    [rows, page],
  );

  if (rows.length === 0) {
    return (
      <p className="rounded-lg border border-dashed bg-muted/30 px-6 py-10 text-center text-sm text-muted-foreground">
        Aucun dossier pour cette organisation.
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <DossiersTable rows={pagedRows} bare />
      <TablePagination
        totalItems={rows.length}
        page={safePage}
        onPageChange={setPage}
        itemLabel="dossier"
      />
    </div>
  );
}
