"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { formatXof } from "@/lib/domain/balance";
import {
  creditAmountClass,
  debitAmountClass,
  formatDebitCreditCells,
  ledgerSectionCopy,
  ledgerTable,
  mutedDashClass,
} from "@/components/ledger/ledger-table-styles";
import type { TransactionListColumnId } from "@/lib/ui/list-table-columns";
import type { LedgerEntrySerialized } from "@/lib/modules/ledger/serialize";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const copy = ledgerSectionCopy();

const HEADER: Record<
  TransactionListColumnId,
  { label: ReactNode; className?: string }
> = {
  date: { label: "Date" },
  customer: { label: "Client" },
  label: { label: "Libellé", className: "min-w-[12rem]" },
  links: { label: "Liens", className: "min-w-[10rem]" },
  debit: { label: "Débit", className: "text-right" },
  credit: { label: "Crédit", className: "text-right" },
};

function defaultVisibleIds(
  showCustomer: boolean,
  showActions: boolean,
): TransactionListColumnId[] {
  const ids: TransactionListColumnId[] = [
    "date",
    ...(showCustomer ? (["customer"] as const) : []),
    "label",
    "links",
    "debit",
    "credit",
  ];
  return ids;
}

export function LedgerEntriesTable({
  rows,
  showCustomer = false,
  canReverse = false,
  onReverse,
  visibleColumnIds: visibleColumnIdsProp,
}: {
  rows: LedgerEntrySerialized[];
  showCustomer?: boolean;
  canReverse?: boolean;
  onReverse?: (entry: LedgerEntrySerialized) => void;
  /** When set (e.g. `/transactions`), enables user column prefs. */
  visibleColumnIds?: TransactionListColumnId[];
}) {
  if (rows.length === 0) {
    return (
      <p className="rounded-lg border border-dashed bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
        Aucune écriture pour ce compte.
      </p>
    );
  }

  const showActions = canReverse && onReverse;
  const visibleColumnIds =
    visibleColumnIdsProp ??
    defaultVisibleIds(showCustomer, Boolean(showActions));

  const showLegend =
    visibleColumnIds.includes("debit") || visibleColumnIds.includes("credit");

  function renderCell(columnId: TransactionListColumnId, row: LedgerEntrySerialized) {
    const amount = BigInt(row.amount);
    const { debit, credit } = formatDebitCreditCells(amount, row.balanceSide);

    switch (columnId) {
      case "date":
        return (
          <td key={columnId} className={ledgerTable.tdDate}>
            {row.effectiveDate}
          </td>
        );
      case "customer":
        return (
          <td key={columnId} className={ledgerTable.td}>
            <Link
              href={`/clients/${row.customerId}?tab=transactions`}
              className={ledgerTable.labelLink}
            >
              {row.customerName}
            </Link>
          </td>
        );
      case "label":
        return (
          <td key={columnId} className={ledgerTable.td}>
            <div className="space-y-0.5">
              <p className="font-medium">{row.label}</p>
              <p className={ledgerTable.detail}>
                {row.transactionTypeName}
                {row.reversesEntryId ? " · Contre-passation" : null}
                {row.reversedByEntryId ? " · Contre-passée" : null}
              </p>
              {row.notes ? (
                <p className={ledgerTable.detail}>{row.notes}</p>
              ) : null}
            </div>
          </td>
        );
      case "links":
        return (
          <td key={columnId} className={ledgerTable.td}>
            {row.allocations.length > 0 ? (
              <ul className="flex flex-col gap-1 text-xs">
                {row.allocations.map((a) => (
                  <li key={a.id}>
                    <Link
                      href={`/dossiers/${a.dossierId}`}
                      className={ledgerTable.link}
                    >
                      {a.dossierNumber}
                    </Link>
                    {a.blReference ? (
                      <span className="text-muted-foreground">
                        {" "}
                        · BL {a.blReference}
                      </span>
                    ) : null}
                    <span
                      className={
                        row.balanceSide === "credit"
                          ? creditAmountClass
                          : debitAmountClass
                      }
                    >
                      {" "}
                      — {formatXof(BigInt(a.amount))} XOF
                    </span>
                  </li>
                ))}
              </ul>
            ) : row.dossierId && row.dossierNumber ? (
              <Link
                href={`/dossiers/${row.dossierId}`}
                className={ledgerTable.link}
              >
                {row.dossierNumber}
              </Link>
            ) : (
              <span className={mutedDashClass}>—</span>
            )}
          </td>
        );
      case "debit":
        return (
          <td key={columnId} className={ledgerTable.amountCell}>
            {debit ? (
              <span className={debitAmountClass}>{debit}</span>
            ) : (
              <span className={mutedDashClass}>—</span>
            )}
          </td>
        );
      case "credit":
        return (
          <td key={columnId} className={ledgerTable.amountCell}>
            {credit ? (
              <span className={creditAmountClass}>{credit}</span>
            ) : (
              <span className={mutedDashClass}>—</span>
            )}
          </td>
        );
      default:
        return null;
    }
  }

  return (
    <div className={ledgerTable.wrapper}>
      {showLegend ? (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b bg-muted/20 px-4 py-2 text-[11px] text-muted-foreground">
          {visibleColumnIds.includes("debit") ? (
            <span>
              <span className={debitAmountClass}>Débit</span> — {copy.legendDebit}
            </span>
          ) : null}
          {visibleColumnIds.includes("credit") ? (
            <span>
              <span className={creditAmountClass}>Crédit</span> —{" "}
              {copy.legendCredit}
            </span>
          ) : null}
        </div>
      ) : null}
      <div className={ledgerTable.scroll}>
        <table
          className={cn(
            ledgerTable.table,
            visibleColumnIds.includes("customer")
              ? "min-w-[960px]"
              : "min-w-[800px]",
          )}
        >
          <thead>
            <tr className={ledgerTable.theadRow}>
              {visibleColumnIds.map((id) => {
                const meta = HEADER[id];
                return (
                  <th
                    key={id}
                    className={cn(
                      id === "debit" || id === "credit"
                        ? ledgerTable.thRight
                        : ledgerTable.th,
                      meta.className,
                    )}
                  >
                    {meta.label}
                  </th>
                );
              })}
              {showActions ? (
                <th className={ledgerTable.thRight}>
                  <span className="sr-only">Actions</span>
                </th>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className={cn(ledgerTable.bodyRow, "align-top")}>
                {visibleColumnIds.map((id) => renderCell(id, row))}
                {showActions ? (
                  <td className={ledgerTable.amountCell}>
                    {row.canReverse ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 text-xs"
                        onClick={() => onReverse(row)}
                      >
                        Contre-passer
                      </Button>
                    ) : (
                      <span className={mutedDashClass}>—</span>
                    )}
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className={ledgerTable.footer}>{copy.footerTransactions}</p>
    </div>
  );
}
