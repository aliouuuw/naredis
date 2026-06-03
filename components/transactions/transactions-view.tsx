"use client";

import Link from "next/link";
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
import { RecordTransactionForm } from "./record-transaction-form";
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
}: {
  rows: LedgerEntrySerialized[];
  customers: CustomerOption[];
  transactionTypes: TransactionTypeSerialized[];
  dossiers: DossierAllocationOption[];
  canRecord: boolean;
  viewState: TransactionsViewState;
  today: string;
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

  const selectedCustomer = customers.find((c) => c.id === customerId);

  return (
    <div className="space-y-8">
      <TransactionsToolbar
        state={viewState}
        totalCount={rows.length}
        customers={customers}
        transactionTypes={transactionTypes}
        dossiers={dossiers}
        today={today}
      />

      {canRecord && selectedCustomer ? (
        <RecordTransactionForm
          customerId={selectedCustomer.id}
          customerName={selectedCustomer.name}
          dossiers={dossiers}
          transactionTypes={transactionTypes}
        />
      ) : canRecord ? (
        <p className="text-sm text-muted-foreground">
          Ajoutez un filtre <strong>Client</strong> pour saisir une transaction
          ici, ou ouvrez une{" "}
          <Link href="/clients" className="underline">
            fiche client
          </Link>
          .
        </p>
      ) : null}

      <GroupedLedgerList tree={tree} showCustomer />
    </div>
  );
}
