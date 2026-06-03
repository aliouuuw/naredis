"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useTableColumns } from "@/components/hooks/use-table-columns";
import { useTablePage } from "@/components/hooks/use-table-page";
import { TableColumnSettings } from "@/components/ui/table-column-settings";
import { DownloadExcelButton } from "@/components/ui/download-excel-button";
import { TablePagination } from "@/components/ui/table-pagination";
import { listExportUrl } from "@/lib/ui/list-export-query";
import {
  TRANSACTION_LIST_COLUMNS,
  TRANSACTION_LIST_TABLE_ID,
  type TransactionListColumnId,
} from "@/lib/ui/list-table-columns";
import { paginateSlice } from "@/lib/ui/table-pagination";
import type {
  LedgerEntrySerialized,
  TransactionTypeSerialized,
} from "@/lib/modules/ledger/serialize";
import type { DossierAllocationOption } from "@/lib/modules/ledger/service";
import {
  buildGroupTree,
  sortLedgerRows,
  type TransactionsViewState,
} from "@/lib/modules/ledger/transactions-query";
import { GroupedLedgerList } from "./grouped-ledger-list";
import { TransactionsToolbar } from "./transactions-toolbar";

type CustomerOption = { id: string; name: string };

export function TransactionsView({
  rows,
  customers,
  transactionTypes,
  dossiers,
  canRecord,
  viewState,
  today,
  recordIntent = false,
}: {
  rows: LedgerEntrySerialized[];
  customers: CustomerOption[];
  transactionTypes: TransactionTypeSerialized[];
  dossiers: DossierAllocationOption[];
  canRecord: boolean;
  viewState: TransactionsViewState;
  today: string;
  recordIntent?: boolean;
}) {
  const searchParams = useSearchParams();
  const { page, setPage } = useTablePage();
  const tableColumns = useTableColumns(
    TRANSACTION_LIST_TABLE_ID,
    TRANSACTION_LIST_COLUMNS,
  );

  const sorted = useMemo(
    () => sortLedgerRows(rows, viewState.sort),
    [rows, viewState.sort],
  );

  const { items: pagedRows, page: safePage } = useMemo(
    () => paginateSlice(sorted, page),
    [sorted, page],
  );

  const tree = useMemo(
    () => buildGroupTree(pagedRows, viewState.groupBy),
    [pagedRows, viewState.groupBy],
  );

  const transactionsExportUrl = useMemo(
    () => listExportUrl("/api/transactions/export", searchParams),
    [searchParams],
  );

  return (
    <div className="space-y-6">
      <TransactionsToolbar
        state={viewState}
        totalCount={sorted.length}
        customers={customers}
        transactionTypes={transactionTypes}
        dossiers={dossiers}
        today={today}
        defaultFiltersOpen={recordIntent}
        exportExcel={
          <DownloadExcelButton exportUrl={transactionsExportUrl} />
        }
        columnSettings={
          tableColumns.ready ? (
            <TableColumnSettings
              columns={TRANSACTION_LIST_COLUMNS}
              prefs={tableColumns.prefs}
              onPrefsChange={tableColumns.updatePrefs}
              onReset={tableColumns.resetPrefs}
            />
          ) : null
        }
      />

      {sorted.length === 0 ? (
        <div className="rounded-lg border border-dashed bg-muted/30 px-6 py-10 text-center">
          <p className="text-sm text-muted-foreground">
            Aucune écriture ne correspond à ces filtres.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border bg-card">
          <GroupedLedgerList
            tree={tree}
            showCustomer
            bare
            visibleColumnIds={
              tableColumns.visibleIds as TransactionListColumnId[]
            }
          />
          <TablePagination
            totalItems={sorted.length}
            page={safePage}
            onPageChange={setPage}
            itemLabel="écriture"
          />
        </div>
      )}
    </div>
  );
}
