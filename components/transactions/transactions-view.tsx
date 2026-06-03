"use client";

import { useMemo } from "react";
import { useTablePage } from "@/components/hooks/use-table-page";
import { TablePagination } from "@/components/ui/table-pagination";
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
  const { page, setPage } = useTablePage();

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
      />

      {sorted.length === 0 ? (
        <div className="rounded-lg border border-dashed bg-muted/30 px-6 py-10 text-center">
          <p className="text-sm text-muted-foreground">
            Aucune écriture ne correspond à ces filtres.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border bg-card">
          <GroupedLedgerList tree={tree} showCustomer bare />
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
