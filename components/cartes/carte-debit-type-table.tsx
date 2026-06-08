"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { formatXof } from "@/lib/domain/balance";
import type { CarteLedgerSnapshotSerialized } from "@/lib/modules/gainde-cards/serialize";
import { cn } from "@/lib/utils";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR").format(new Date(value));
}

export function CarteDebitTypeTable({
  snapshot,
}: {
  snapshot: CarteLedgerSnapshotSerialized;
}) {
  const [openTypes, setOpenTypes] = useState<Set<string>>(() => new Set());

  if (snapshot.debitTypeRows.length === 0) {
    return null;
  }

  function toggleType(typeId: string) {
    setOpenTypes((prev) => {
      const next = new Set(prev);
      if (next.has(typeId)) next.delete(typeId);
      else next.add(typeId);
      return next;
    });
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-muted-foreground">
        Autres débits (hors déclarations)
      </h3>
      <div className="overflow-hidden rounded-lg border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40 text-left text-muted-foreground">
              <th className="w-10 px-3 py-3" />
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium text-center">Écrit.</th>
              <th className="px-4 py-3 font-medium text-right">Montant</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {snapshot.debitTypeRows.map((row) => {
              const open = openTypes.has(row.debitTypeId);
              return (
                <DebitTypeRows
                  key={row.debitTypeId}
                  row={row}
                  open={open}
                  onToggle={() => toggleType(row.debitTypeId)}
                />
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t bg-muted/50 font-semibold">
              <td
                colSpan={3}
                className="px-4 py-3 text-xs uppercase tracking-wide text-muted-foreground"
              >
                Total autres débits
              </td>
              <td className="px-4 py-3 text-right tabular-nums">
                {formatXof(BigInt(snapshot.totalManualDebits))} XOF
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

function DebitTypeRows({
  row,
  open,
  onToggle,
}: {
  row: CarteLedgerSnapshotSerialized["debitTypeRows"][number];
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <>
      <tr className="bg-card hover:bg-muted/30">
        <td className="px-3 py-3">
          <button
            type="button"
            onClick={onToggle}
            disabled={row.entryCount === 0}
            className={cn(
              "flex size-7 items-center justify-center rounded-md",
              row.entryCount === 0 ? "opacity-30" : "hover:bg-muted",
            )}
            aria-expanded={open}
            aria-label={open ? "Replier" : "Déplier"}
          >
            <ChevronDown
              className={cn(
                "size-4 transition-transform",
                open && "rotate-180",
              )}
            />
          </button>
        </td>
        <td className="px-4 py-3 font-medium">{row.debitTypeName}</td>
        <td className="px-4 py-3 text-center tabular-nums text-muted-foreground">
          {row.entryCount}
        </td>
        <td className="px-4 py-3 text-right tabular-nums">
          {formatXof(BigInt(row.total))} XOF
        </td>
      </tr>
      {open && row.entries.length > 0 ? (
        <tr className="bg-muted/20">
          <td colSpan={4} className="px-4 py-3">
            <ul className="space-y-2">
              {row.entries.map((entry) => (
                <li
                  key={entry.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-md border bg-card px-3 py-2 text-xs"
                >
                  <div className="min-w-0 space-y-0.5">
                    <p className="font-medium">
                      {formatDate(entry.effectiveDate)}
                      {entry.label ? ` — ${entry.label}` : ""}
                    </p>
                    {entry.notes ? (
                      <p className="text-muted-foreground">{entry.notes}</p>
                    ) : null}
                  </div>
                  <p className="shrink-0 tabular-nums font-medium">
                    {formatXof(BigInt(entry.amount))} XOF
                  </p>
                </li>
              ))}
            </ul>
          </td>
        </tr>
      ) : null}
    </>
  );
}
