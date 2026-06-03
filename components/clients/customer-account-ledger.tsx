import Link from "next/link";
import { Fragment } from "react";
import {
  buildAccountLedger,
  formatRunningBalanceLabel,
} from "@/lib/modules/customers/account-ledger";
import type { DeclarationListItemSerialized } from "@/lib/modules/declarations/serialize-list";
import type { LedgerEntrySerialized } from "@/lib/modules/ledger/serialize";
import { cn } from "@/lib/utils";

const thClass =
  "px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground";
const tdClass = "px-3 py-2.5 align-top text-sm";
const amountClass = "tabular-nums text-right whitespace-nowrap";

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
    <div className="overflow-hidden rounded-lg border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className={thClass}>Date</th>
              <th className={cn(thClass, "min-w-[12rem]")}>Libellé</th>
              <th className={cn(thClass, amountClass)}>Débit</th>
              <th className={cn(thClass, amountClass)}>Crédit</th>
              <th className={cn(thClass, amountClass)}>Solde</th>
            </tr>
          </thead>
          <tbody>
            {days.map((day) => (
              <Fragment key={day.dayKey}>
                <tr
                  className="border-b bg-muted/30"
                >
                  <td
                    colSpan={5}
                    className="px-3 py-2 text-xs font-semibold tracking-wide text-foreground capitalize"
                  >
                    {day.dayLabel}
                  </td>
                </tr>
                {day.rows.map((row) => (
                  <tr
                    key={row.id}
                    className={cn(
                      "border-b border-border/60 transition-colors hover:bg-muted/20",
                      row.kind === "declaration" && "bg-muted/10",
                    )}
                  >
                    <td className={cn(tdClass, "tabular-nums text-muted-foreground")}>
                      {row.dateDisplay}
                    </td>
                    <td className={tdClass}>
                      <div className="space-y-0.5">
                        <Link
                          href={row.href}
                          className={cn(
                            "font-medium hover:underline",
                            row.kind === "declaration" &&
                              "text-muted-foreground",
                          )}
                        >
                          {row.kind === "ledger"
                            ? row.label
                            : `Décl. ${row.label}`}
                        </Link>
                        {row.detail ? (
                          <p className="text-xs text-muted-foreground">
                            {row.detail}
                          </p>
                        ) : null}
                      </div>
                    </td>
                    <td className={cn(tdClass, amountClass, "text-foreground")}>
                      {row.debitDisplay ?? (
                        <span className="text-muted-foreground/50">—</span>
                      )}
                    </td>
                    <td className={cn(tdClass, amountClass, "text-foreground")}>
                      {row.creditDisplay ?? (
                        <span className="text-muted-foreground/50">—</span>
                      )}
                    </td>
                    <td
                      className={cn(
                        tdClass,
                        amountClass,
                        "font-medium",
                        row.affectsBalance
                          ? "text-foreground"
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
      <p className="border-t bg-muted/20 px-4 py-2 text-[11px] text-muted-foreground">
        Les lignes déclaration sont informatives (fiche BL) et ne mouvementent
        pas le solde. Solde = cumul des écritures débit / crédit.
      </p>
    </div>
  );
}
