"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { GroupedLedgerList } from "./grouped-ledger-list";
import { RecordTransactionDialog } from "./record-transaction-dialog";
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
  const [recordDialogOpen, setRecordDialogOpen] = useState(false);

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
    if (recordIntent && selectedCustomer) {
      setRecordDialogOpen(true);
    }
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
        <>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button
              type="button"
              className="rounded-full"
              onClick={() => setRecordDialogOpen(true)}
            >
              <Plus className="size-4" />
              Nouvelle transaction
            </Button>
          </div>
          <RecordTransactionDialog
            open={recordDialogOpen}
            onOpenChange={setRecordDialogOpen}
            customerId={selectedCustomer.id}
            customerName={selectedCustomer.name}
            dossiers={dossiers}
            transactionTypes={transactionTypes}
          />
        </>
      ) : canRecord ? (
        <p className="text-sm text-muted-foreground">
          Ajoutez un filtre <strong>Client</strong> pour saisir une transaction,
          ou ouvrez une{" "}
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
