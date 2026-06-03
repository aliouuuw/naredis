"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { agencyCalendarDate } from "@/lib/domain/timezone";
import type {
  LedgerEntrySerialized,
  TransactionTypeSerialized,
} from "@/lib/modules/ledger/serialize";
import type { DossierAllocationOption } from "@/lib/modules/ledger/service";
import { LedgerEntriesTable } from "./ledger-entries-table";
import { RecordTransactionForm } from "./record-transaction-form";

type CustomerOption = { id: string; name: string };

type GroupBy = "day" | "client" | "type" | "none";

export function TransactionsView({
  rows,
  customers,
  transactionTypes,
  dossiersByCustomerId,
  canRecord,
  defaultCustomerId,
  defaultDateFrom,
}: {
  rows: LedgerEntrySerialized[];
  customers: CustomerOption[];
  transactionTypes: TransactionTypeSerialized[];
  dossiersByCustomerId: Record<string, DossierAllocationOption[]>;
  canRecord: boolean;
  defaultCustomerId?: string;
  defaultDateFrom?: string;
}) {
  const today = agencyCalendarDate();
  const [customerId, setCustomerId] = useState(defaultCustomerId ?? "");
  const [transactionTypeId, setTransactionTypeId] = useState("");
  const [balanceSide, setBalanceSide] = useState<"" | "debit" | "credit">("");
  const [dateFrom, setDateFrom] = useState(defaultDateFrom ?? today);
  const [dateTo, setDateTo] = useState(today);
  const [groupBy, setGroupBy] = useState<GroupBy>("day");

  const filtered = useMemo(() => {
    return rows.filter((row) => {
      if (customerId && row.customerId !== customerId) return false;
      if (transactionTypeId && row.transactionTypeId !== transactionTypeId) {
        return false;
      }
      if (balanceSide && row.balanceSide !== balanceSide) return false;
      if (dateFrom && row.effectiveDate < dateFrom) return false;
      if (dateTo && row.effectiveDate > dateTo) return false;
      return true;
    });
  }, [rows, customerId, transactionTypeId, balanceSide, dateFrom, dateTo]);

  const groups = useMemo(() => {
    if (groupBy === "none") {
      return [{ key: "all", label: "Toutes", rows: filtered }];
    }

    const map = new Map<
      string,
      { label: string; rows: LedgerEntrySerialized[] }
    >();

    for (const row of filtered) {
      let key: string;
      let label: string;
      if (groupBy === "day") {
        key = row.effectiveDate;
        label = row.effectiveDate;
      } else if (groupBy === "client") {
        key = row.customerId;
        label = row.customerName;
      } else {
        key = row.transactionTypeId ?? row.transactionTypeName;
        label = row.transactionTypeName;
      }
      const bucket = map.get(key) ?? { label, rows: [] };
      bucket.rows.push(row);
      map.set(key, bucket);
    }

    return [...map.entries()]
      .map(([key, bucket]) => ({ key, ...bucket }))
      .sort((a, b) => b.label.localeCompare(a.label));
  }, [filtered, groupBy]);

  const selectedCustomer = customers.find((c) => c.id === customerId);
  const dossiers = customerId ? (dossiersByCustomerId[customerId] ?? []) : [];

  return (
    <div className="space-y-8">
      <section className="rounded-lg border bg-card p-4">
        <h2 className="mb-3 text-sm font-semibold">Filtres</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <label className="flex flex-col gap-1 text-xs">
            <span className="font-medium text-muted-foreground">Client</span>
            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className="h-8 rounded-lg border border-input bg-background px-2 text-sm"
            >
              <option value="">Tous</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs">
            <span className="font-medium text-muted-foreground">Type</span>
            <select
              value={transactionTypeId}
              onChange={(e) => setTransactionTypeId(e.target.value)}
              className="h-8 rounded-lg border border-input bg-background px-2 text-sm"
            >
              <option value="">Tous</option>
              {transactionTypes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.balanceSide === "credit" ? "Crédit" : "Débit"})
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs">
            <span className="font-medium text-muted-foreground">Sens</span>
            <select
              value={balanceSide}
              onChange={(e) =>
                setBalanceSide(e.target.value as "" | "debit" | "credit")
              }
              className="h-8 rounded-lg border border-input bg-background px-2 text-sm"
            >
              <option value="">Tous</option>
              <option value="credit">Crédit</option>
              <option value="debit">Débit</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs">
            <span className="font-medium text-muted-foreground">Du</span>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="h-8 rounded-lg border border-input bg-background px-2 text-sm"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs">
            <span className="font-medium text-muted-foreground">Au</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="h-8 rounded-lg border border-input bg-background px-2 text-sm"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs">
            <span className="font-medium text-muted-foreground">Regrouper par</span>
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value as GroupBy)}
              className="h-8 rounded-lg border border-input bg-background px-2 text-sm"
            >
              <option value="day">Jour</option>
              <option value="client">Client</option>
              <option value="type">Type</option>
              <option value="none">Aucun</option>
            </select>
          </label>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {filtered.length} transaction{filtered.length !== 1 ? "s" : ""} affichée
          {filtered.length !== 1 ? "s" : ""} (sur {rows.length} chargées).
        </p>
      </section>

      {canRecord && selectedCustomer ? (
        <RecordTransactionForm
          customerId={selectedCustomer.id}
          customerName={selectedCustomer.name}
          dossiers={dossiers}
          transactionTypes={transactionTypes}
        />
      ) : canRecord ? (
        <p className="text-sm text-muted-foreground">
          Sélectionnez un client dans les filtres pour enregistrer une transaction,
          ou ouvrez une{" "}
          <Link href="/clients" className="underline">
            fiche client
          </Link>
          .
        </p>
      ) : null}

      <div className="space-y-6">
        {groups.map((group) => (
          <section key={group.key}>
            {groupBy !== "none" ? (
              <h3 className="mb-2 text-sm font-semibold text-muted-foreground">
                {group.label}
                <span className="ml-2 font-normal">({group.rows.length})</span>
              </h3>
            ) : null}
            <LedgerEntriesTable rows={group.rows} showCustomer />
          </section>
        ))}
      </div>
    </div>
  );
}
