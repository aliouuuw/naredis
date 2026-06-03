"use client";

import Link from "next/link";
import { Check, ChevronRight } from "lucide-react";
import { formatXof } from "@/lib/domain/balance";
import { computeDeclarationReste } from "@/lib/domain/declaration-reste";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { DeclarationListItemSerialized } from "@/lib/modules/declarations/serialize-list";

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("fr-FR").format(new Date(value));
}

function formatMoney(value: string | null) {
  if (value == null) return "—";
  return `${formatXof(BigInt(value))} XOF`;
}

function formatReste(
  clientAmountPaid: string | null,
  costPrice: string | null,
) {
  const reste = computeDeclarationReste(
    clientAmountPaid != null ? BigInt(clientAmountPaid) : null,
    costPrice != null ? BigInt(costPrice) : null,
  );
  if (reste == null) return "—";
  return `${formatXof(reste)} XOF`;
}

export function DeclarationsTable({
  rows,
  onOpenRow,
}: {
  rows: DeclarationListItemSerialized[];
  onOpenRow: (id: string) => void;
}) {
  return (
    <div className="overflow-x-auto rounded-lg border bg-card">
      <table className="w-full min-w-[960px] text-sm">
        <thead>
          <tr className="border-b bg-muted/40 text-left text-muted-foreground">
            <th className="px-4 py-3 font-medium">N° décl.</th>
            <th className="px-4 py-3 font-medium">Client</th>
            <th className="px-4 py-3 font-medium">Dossier</th>
            <th className="px-4 py-3 font-medium">BL</th>
            <th className="px-4 py-3 font-medium">Zone</th>
            <th className="px-4 py-3 font-medium">Date</th>
            <th className="px-4 py-3 font-medium text-right">Montant</th>
            <th className="px-4 py-3 font-medium text-right">Reste</th>
            <th className="px-4 py-3 font-medium text-center">BAD</th>
            <th className="px-4 py-3 font-medium text-right">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {rows.map((row) => (
            <tr
              key={row.id}
              tabIndex={0}
              role="button"
              aria-label={`Ouvrir la déclaration ${row.declarationNumber}`}
              className="cursor-pointer transition-colors hover:bg-muted/40 focus-visible:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
              onClick={() => onOpenRow(row.id)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onOpenRow(row.id);
                }
              }}
            >
              <td className="px-4 py-3 font-mono text-xs font-medium text-foreground">
                {row.declarationNumber}
              </td>
              <td className="px-4 py-3">
                <span className="text-muted-foreground">{row.customerSlug}</span>
                <span className="mx-1 text-muted-foreground/50">·</span>
                {row.customerName}
              </td>
              <td className="px-4 py-3 font-mono text-xs">
                <Link
                  href={`/dossiers/${row.dossierId}`}
                  className="font-medium hover:underline"
                  onClick={(event) => event.stopPropagation()}
                >
                  {row.dossierNumber}
                </Link>
              </td>
              <td className="px-4 py-3 font-mono text-xs">
                {row.blReference ? (
                  <Link
                    href={`/dossiers/${row.dossierId}`}
                    className="hover:underline"
                    onClick={(event) => event.stopPropagation()}
                  >
                    {row.blReference}
                  </Link>
                ) : (
                  "—"
                )}
              </td>
              <td className="px-4 py-3 tabular-nums">{row.zoneOrTerminal ?? "—"}</td>
              <td className="px-4 py-3 whitespace-nowrap tabular-nums">
                {formatDate(row.declarationDate)}
              </td>
              <td className="px-4 py-3 text-right tabular-nums">
                {formatMoney(row.clientAmountPaid)}
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                {formatReste(row.clientAmountPaid, row.costPrice)}
              </td>
              <td className="px-4 py-3 text-center">
                {row.bonADelivrer ? (
                  <Check
                    className="mx-auto size-4 text-emerald-600"
                    aria-label="Bon à délivrer"
                  />
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </td>
              <td className="px-4 py-3 text-right">
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onOpenRow(row.id);
                  }}
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" }),
                    "inline-flex gap-1",
                  )}
                >
                  Ouvrir
                  <ChevronRight className="size-4" aria-hidden />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
