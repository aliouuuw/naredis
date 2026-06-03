import Link from "next/link";
import { Fragment } from "react";
import {
  buildAccountLedger,
  formatRunningBalanceLabel,
} from "@/lib/modules/customers/account-ledger";
import type { DeclarationListItemSerialized } from "@/lib/modules/declarations/serialize-list";
import type { LedgerEntrySerialized } from "@/lib/modules/ledger/serialize";
import {
  balanceSideAmountClass,
  creditAmountClass,
  debitAmountClass,
  ledgerSectionCopy,
  ledgerTable,
  mutedDashClass,
} from "@/components/ledger/ledger-table-styles";
import { cn } from "@/lib/utils";

const copy = ledgerSectionCopy();

export function CustomerAccountLedger({
  ledgerEntries,
  declarations,
}: {
  ledgerEntries: LedgerEntrySerialized[];
  declarations: DeclarationListItemSerialized[];
}) {
  const days = buildAccountLedger(ledgerEntries, declarations);

  if (days.length === 0) {
    return (
      <p className="rounded-lg border border-dashed bg-muted/20 px-4 py-12 text-center text-sm text-muted-foreground">
        Aucune écriture ni déclaration sur ce compte.
      </p>
    );
  }

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
        <table className={cn(ledgerTable.table, "min-w-[880px]")}>
          <thead>
            <tr className={ledgerTable.theadRow}>
              <th className={ledgerTable.th}>Date</th>
              <th className={cn(ledgerTable.th, "min-w-[12rem]")}>Libellé</th>
              <th className={cn(ledgerTable.th, "min-w-[10rem]")}>Liens</th>
              <th className={ledgerTable.thRight}>Débit</th>
              <th className={ledgerTable.thRight}>Crédit</th>
              <th className={ledgerTable.thRight}>Solde</th>
            </tr>
          </thead>
          <tbody>
            {days.map((day) => (
              <Fragment key={day.dayKey}>
                <tr className={ledgerTable.dayHeaderRow}>
                  <td colSpan={6} className={ledgerTable.dayHeaderCell}>
                    {day.dayLabel}
                  </td>
                </tr>
                {day.rows.map((row) => (
                  <tr
                    key={row.id}
                    className={cn(
                      ledgerTable.bodyRow,
                      row.kind === "declaration" && ledgerTable.declarationRow,
                    )}
                  >
                    <td className={ledgerTable.tdDate}>{row.dateDisplay}</td>
                    <td className={ledgerTable.td}>
                      <div className="space-y-0.5">
                        <Link
                          href={row.href}
                          className={cn(
                            ledgerTable.labelLink,
                            row.kind === "declaration" &&
                              "text-muted-foreground",
                          )}
                        >
                          {row.kind === "ledger"
                            ? row.label
                            : `Décl. ${row.label}`}
                        </Link>
                        {row.detail ? (
                          <p className={ledgerTable.detail}>{row.detail}</p>
                        ) : null}
                      </div>
                    </td>
                    <td className={ledgerTable.td}>
                      {row.links.length > 0 ? (
                        <ul className="flex flex-wrap gap-x-2 gap-y-1 text-xs">
                          {row.links.map((link) => (
                            <li key={`${row.id}-${link.href}`}>
                              <Link href={link.href} className={ledgerTable.link}>
                                {link.label}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span className={mutedDashClass}>—</span>
                      )}
                    </td>
                    <td className={ledgerTable.amountCell}>
                      {row.debitDisplay ? (
                        <span className={debitAmountClass}>
                          {row.debitDisplay}
                        </span>
                      ) : (
                        <span className={mutedDashClass}>—</span>
                      )}
                    </td>
                    <td className={ledgerTable.amountCell}>
                      {row.creditDisplay ? (
                        <span className={creditAmountClass}>
                          {row.creditDisplay}
                        </span>
                      ) : (
                        <span className={mutedDashClass}>—</span>
                      )}
                    </td>
                    <td
                      className={cn(
                        ledgerTable.amountCell,
                        row.affectsBalance
                          ? balanceSideAmountClass(
                              row.runningBalance.side,
                              BigInt(row.runningBalance.amount),
                            )
                          : "text-muted-foreground",
                      )}
                    >
                      {formatRunningBalanceLabel(row)}
                    </td>
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
      <p className={ledgerTable.footer}>{copy.footerResume}</p>
    </div>
  );
}
