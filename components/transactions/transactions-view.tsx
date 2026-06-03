"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
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

  const selectedCustomer = customers.find((c) => c.id === customerId);

  useEffect(() => {
    if (!recordIntent || !selectedCustomer) return;
    const timer = window.setTimeout(() => {
      document
        .getElementById("record-transaction")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);
    return () => window.clearTimeout(timer);
  }, [recordIntent, selectedCustomer]);

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

      {canRecord && selectedCustomer ? (
        <RecordTransactionForm
          customerId={selectedCustomer.id}
          customerName={selectedCustomer.name}
          dossiers={dossiers}
          transactionTypes={transactionTypes}
          highlighted={recordIntent}
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
