"use client";

import { useMemo } from "react";
import type {
  LedgerEntrySerialized,
  TransactionTypeSerialized,
} from "@/lib/modules/ledger/serialize";
import type { DossierAllocationOption } from "@/lib/modules/ledger/service";
import {
  activeFilterRules,
  buildGroupTree,
  sortLedgerRows,
  type TransactionsViewState,
} from "@/lib/modules/ledger/transactions-query";
import { GroupedLedgerList } from "./grouped-ledger-list";
import { RecordTransactionLauncher } from "./record-transaction-launcher";
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
  const sorted = useMemo(
    () => sortLedgerRows(rows, viewState.sort),
    [rows, viewState.sort],
  );

  const tree = useMemo(
    () => buildGroupTree(sorted, viewState.groupBy),
    [sorted, viewState.groupBy],
  );

  const customerId = activeFilterRules(viewState.rules).find(
    (r) => r.field === "customer" && r.operator === "eq",
  )?.value;

  return (
    <div className="space-y-8">
      <TransactionsToolbar
        state={viewState}
        totalCount={rows.length}
        customers={customers}
        transactionTypes={transactionTypes}
        dossiers={dossiers}
        today={today}
        defaultFiltersOpen={recordIntent}
      />

      {canRecord ? (
        <div className="flex flex-wrap items-center justify-end gap-2">
          <RecordTransactionLauncher
            variant="inline"
            customers={customers}
            transactionTypes={transactionTypes}
            initialCustomerId={customerId}
            recordIntent={recordIntent}
          />
        </div>
      ) : null}

      <GroupedLedgerList tree={tree} showCustomer />
    </div>
  );
}
