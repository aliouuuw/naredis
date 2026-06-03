"use client";

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
import type { LedgerEntrySerialized } from "@/lib/modules/ledger/serialize";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const copy = ledgerSectionCopy();

export function LedgerEntriesTable({
  rows,
  showCustomer = false,
  canReverse = false,
  onReverse,
}: {
  rows: LedgerEntrySerialized[];
  showCustomer?: boolean;
  canReverse?: boolean;
  onReverse?: (entry: LedgerEntrySerialized) => void;
}) {
  if (rows.length === 0) {
    return (
      <p className="rounded-lg border border-dashed bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
        Aucune écriture pour ce compte.
      </p>
    );
  }

  const showActions = canReverse && onReverse;

  return (
    <div className={ledgerTable.wrapper}>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b bg-muted/20 px-4 py-2 text-[11px] text-muted-foreground">
        <span>
          <span className={debitAmountClass}>Débit</span> — {copy.legendDebit}
        </span>
        <span>
          <span className={creditAmountClass}>Crédit</span> — {copy.legendCredit}
        </span>
      </div>
      <div className={ledgerTable.scroll}>
        <table
          className={cn(
            ledgerTable.table,
            showCustomer ? "min-w-[960px]" : "min-w-[800px]",
          )}
        >
          <thead>
            <tr className={ledgerTable.theadRow}>
              <th className={ledgerTable.th}>Date</th>
              {showCustomer ? (
                <th className={ledgerTable.th}>Client</th>
              ) : null}
              <th className={cn(ledgerTable.th, "min-w-[12rem]")}>Libellé</th>
              <th className={cn(ledgerTable.th, "min-w-[10rem]")}>Liens</th>
              <th className={ledgerTable.thRight}>Débit</th>
              <th className={ledgerTable.thRight}>Crédit</th>
              {showActions ? (
                <th className={ledgerTable.thRight}>
                  <span className="sr-only">Actions</span>
                </th>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const amount = BigInt(row.amount);
              const { debit, credit } = formatDebitCreditCells(
                amount,
                row.balanceSide,
              );

              return (
                <tr key={row.id} className={cn(ledgerTable.bodyRow, "align-top")}>
                  <td className={ledgerTable.tdDate}>{row.effectiveDate}</td>
                  {showCustomer ? (
                    <td className={ledgerTable.td}>
                      <Link
                        href={`/clients/${row.customerId}?tab=transactions`}
                        className={ledgerTable.labelLink}
                      >
                        {row.customerName}
                      </Link>
                    </td>
                  ) : null}
                  <td className={ledgerTable.td}>
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
                  <td className={ledgerTable.td}>
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
                  <td className={ledgerTable.amountCell}>
                    {debit ? (
                      <span className={debitAmountClass}>{debit}</span>
                    ) : (
                      <span className={mutedDashClass}>—</span>
                    )}
                  </td>
                  <td className={ledgerTable.amountCell}>
                    {credit ? (
                      <span className={creditAmountClass}>{credit}</span>
                    ) : (
                      <span className={mutedDashClass}>—</span>
                    )}
                  </td>
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
              );
            })}
          </tbody>
        </table>
      </div>
      <p className={ledgerTable.footer}>{copy.footerTransactions}</p>
    </div>
  );
}
