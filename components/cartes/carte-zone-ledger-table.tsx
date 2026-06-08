"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { formatXof } from "@/lib/domain/balance";
import type { CarteLedgerSnapshotSerialized } from "@/lib/modules/gainde-cards/serialize";
import { cn } from "@/lib/utils";

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("fr-FR").format(new Date(value));
}

export function CarteZoneLedgerTable({
  snapshot,
  onOpenDeclaration,
}: {
  snapshot: CarteLedgerSnapshotSerialized;
  onOpenDeclaration?: (id: string) => void;
}) {
  const [openZones, setOpenZones] = useState<Set<string>>(() => new Set());

  function toggleZone(zoneKey: string) {
    setOpenZones((prev) => {
      const next = new Set(prev);
      if (next.has(zoneKey)) next.delete(zoneKey);
      else next.add(zoneKey);
      return next;
    });
  }

  if (snapshot.zoneRows.length === 0) {
    return (
      <div className="rounded-lg border border-dashed bg-muted/30 px-6 py-10 text-center text-sm text-muted-foreground">
        Aucune déclaration sur cette carte pour la période sélectionnée.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/40 text-left text-muted-foreground">
            <th className="w-10 px-3 py-3" />
            <th className="px-4 py-3 font-medium">Zone</th>
            <th className="px-4 py-3 font-medium text-center">Décl.</th>
            <th className="px-4 py-3 font-medium text-right">Droit GAINDE</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {snapshot.zoneRows.map((row) => {
            const open = openZones.has(row.zoneKey);
            return (
              <ZoneRows
                key={row.zoneKey}
                row={row}
                open={open}
                onToggle={() => toggleZone(row.zoneKey)}
                onOpenDeclaration={onOpenDeclaration}
              />
            );
          })}
        </tbody>
        <tfoot>
          <tr className="border-t bg-muted/50 font-semibold">
            <td colSpan={3} className="px-4 py-3 text-xs uppercase tracking-wide text-muted-foreground">
              Total droit GAINDE
            </td>
            <td className="px-4 py-3 text-right tabular-nums">
              {formatXof(BigInt(snapshot.totalGainde))} XOF
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

function ZoneRows({
  row,
  open,
  onToggle,
  onOpenDeclaration,
}: {
  row: CarteLedgerSnapshotSerialized["zoneRows"][number];
  open: boolean;
  onToggle: () => void;
  onOpenDeclaration?: (id: string) => void;
}) {
  return (
    <>
      <tr className="bg-card hover:bg-muted/30">
        <td className="px-3 py-3">
          <button
            type="button"
            onClick={onToggle}
            disabled={row.declarationCount === 0}
            className={cn(
              "flex size-7 items-center justify-center rounded-md",
              row.declarationCount === 0
                ? "opacity-30"
                : "hover:bg-muted",
            )}
            aria-expanded={open}
            aria-label={
              open ? "Replier les déclarations" : "Voir les déclarations"
            }
          >
            <ChevronDown
              className={cn(
                "size-4 transition-transform",
                open && "rotate-180",
              )}
            />
          </button>
        </td>
        <td className="px-4 py-3">
          <span className="font-mono font-medium">{row.zoneLabel}</span>
        </td>
        <td className="px-4 py-3 text-center tabular-nums text-muted-foreground">
          {row.declarationCount}
        </td>
        <td className="px-4 py-3 text-right tabular-nums">
          {formatXof(BigInt(row.totalGainde))} XOF
        </td>
      </tr>
      {open && row.declarations.length > 0 ? (
        <tr className="bg-muted/20">
          <td colSpan={4} className="px-4 py-3">
            <ul className="space-y-2">
              {row.declarations.map((decl) => (
                <li
                  key={decl.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-md border bg-card px-3 py-2 text-xs"
                >
                  <div className="min-w-0 space-y-0.5">
                    <p className="font-mono font-medium">
                      {onOpenDeclaration ? (
                        <button
                          type="button"
                          className="hover:underline"
                          onClick={() => onOpenDeclaration(decl.id)}
                        >
                          {decl.declarationNumber}
                        </button>
                      ) : (
                        <Link
                          href={`/declarations?open=${decl.id}`}
                          className="hover:underline"
                        >
                          {decl.declarationNumber}
                        </Link>
                      )}
                    </p>
                    <p className="text-muted-foreground">
                      {decl.customerName}
                      {decl.blReference ? ` · BL ${decl.blReference}` : ""}
                      {" · "}
                      {formatDate(decl.declarationDate)}
                    </p>
                  </div>
                  <p className="shrink-0 tabular-nums font-medium">
                    {decl.gaindeDutyAmount
                      ? `${formatXof(BigInt(decl.gaindeDutyAmount))} XOF`
                      : "—"}
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
