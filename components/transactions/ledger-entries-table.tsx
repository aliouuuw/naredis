"use client";

import Link from "next/link";
import { formatBalanceLabel, formatXof } from "@/lib/domain/balance";
import type { LedgerEntrySerialized } from "@/lib/modules/ledger/serialize";
import { Button } from "@/components/ui/button";

const entrySideClass = {
  debit: "text-amber-800 dark:text-amber-300",
  credit: "text-emerald-800 dark:text-emerald-400",
} as const;

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
        Aucune transaction pour ces filtres.
      </p>
    );
  }

  const showActions = canReverse && onReverse;

  return (
    <div className="overflow-x-auto rounded-lg border bg-card">
      <table className="w-full min-w-[720px] text-sm">
        <thead>
          <tr className="border-b bg-muted/40 text-left text-muted-foreground">
            <th className="px-4 py-3 font-medium">Date</th>
            {showCustomer ? (
              <th className="px-4 py-3 font-medium">Client</th>
            ) : null}
            <th className="px-4 py-3 font-medium">Type</th>
            <th className="px-4 py-3 font-medium">Libellé</th>
            <th className="px-4 py-3 font-medium text-right">Montant</th>
            <th className="px-4 py-3 font-medium">Affectations</th>
            {showActions ? (
              <th className="px-4 py-3 font-medium text-right"> </th>
            ) : null}
          </tr>
        </thead>
        <tbody className="divide-y">
          {rows.map((row) => (
            <tr key={row.id} className="align-top">
              <td className="px-4 py-3 whitespace-nowrap tabular-nums">
                {row.effectiveDate}
              </td>
              {showCustomer ? (
                <td className="px-4 py-3">
                  <Link
                    href={`/clients/${row.customerId}?tab=transactions`}
                    className="font-medium hover:underline"
                  >
                    {row.customerName}
                  </Link>
                </td>
              ) : null}
              <td className="px-4 py-3 font-medium">
                {row.transactionTypeName}
                {row.reversesEntryId ? (
                  <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                    Contre-passation
                  </span>
                ) : null}
                {row.reversedByEntryId ? (
                  <span className="mt-0.5 block text-xs font-normal text-amber-700 dark:text-amber-400">
                    Contre-passée
                  </span>
                ) : null}
              </td>
              <td className="px-4 py-3">
                <p>{row.label}</p>
                {row.notes ? (
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {row.notes}
                  </p>
                ) : null}
              </td>
              <td
                className={`px-4 py-3 text-right tabular-nums ${entrySideClass[row.balanceSide]}`}
              >
                {formatXof(BigInt(row.amount))} XOF
                <span className="ml-1 text-xs">
                  {formatBalanceLabel(row.balanceSide)}
                </span>
              </td>
              <td className="px-4 py-3 text-xs text-muted-foreground">
                {row.allocations.length > 0 ? (
                  <ul className="space-y-1">
                    {row.allocations.map((a) => (
                      <li key={a.id}>
                        <Link
                          href={`/dossiers/${a.dossierId}`}
                          className="font-medium text-foreground hover:underline"
                        >
                          {a.dossierNumber}
                        </Link>
                        {a.blReference ? ` · BL ${a.blReference}` : null}
                        {" — "}
                        {formatXof(BigInt(a.amount))} XOF
                      </li>
                    ))}
                  </ul>
                ) : (
                  "—"
                )}
              </td>
              {showActions ? (
                <td className="px-4 py-3 text-right">
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
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
