"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Check, ChevronRight, MoreHorizontal, Trash2 } from "lucide-react";
import { formatXof } from "@/lib/domain/balance";
import { computeDeclarationReste } from "@/lib/domain/declaration-reste";
import type { DeclarationListColumnId } from "@/lib/ui/list-table-columns";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { DeclarationListItemSerialized } from "@/lib/modules/declarations/serialize-list";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

const HEADER: Record<
  DeclarationListColumnId,
  { label: ReactNode; className?: string }
> = {
  number: { label: "N° décl." },
  client: { label: "Client" },
  dossier: { label: "Dossier" },
  bl: { label: "BL" },
  zone: { label: "Zone" },
  date: { label: "Date" },
  containerCount: { label: "Nb cont.", className: "text-center tabular-nums" },
  containers: { label: "N° conteneurs" },
  amount: { label: "Montant client", className: "text-right" },
  gainde: { label: "GAINDE", className: "text-right" },
  cost: { label: "Prix de revient", className: "text-right" },
  reste: { label: "Reste", className: "text-right" },
  agency: { label: "Maison-mère" },
  bad: { label: "BAD", className: "text-center" },
  actions: {
    label: <span className="sr-only">Actions</span>,
    className: "text-right",
  },
};

export function DeclarationsTable({
  rows,
  onOpenRow,
  bare = false,
  visibleColumnIds,
  canDelete = false,
  onDelete,
}: {
  rows: DeclarationListItemSerialized[];
  onOpenRow: (id: string) => void;
  bare?: boolean;
  visibleColumnIds: DeclarationListColumnId[];
  canDelete?: boolean;
  onDelete?: (row: DeclarationListItemSerialized) => void;
}) {
  function renderCell(
    columnId: DeclarationListColumnId,
    row: DeclarationListItemSerialized,
  ) {
    switch (columnId) {
      case "number":
        return (
          <td
            key={columnId}
            className="px-4 py-3 font-mono text-xs font-medium text-foreground"
          >
            {row.declarationNumber}
          </td>
        );
      case "client":
        return (
          <td key={columnId} className="px-4 py-3">
            <span className="text-muted-foreground">{row.customerSlug}</span>
            <span className="mx-1 text-muted-foreground/50">·</span>
            {row.customerName}
          </td>
        );
      case "dossier":
        return (
          <td key={columnId} className="px-4 py-3 font-mono text-xs">
            <Link
              href={`/dossiers/${row.dossierId}`}
              className="font-medium hover:underline"
              onClick={(event) => event.stopPropagation()}
            >
              {row.dossierNumber}
            </Link>
          </td>
        );
      case "bl":
        return (
          <td key={columnId} className="px-4 py-3 font-mono text-xs">
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
        );
      case "zone":
        return (
          <td key={columnId} className="px-4 py-3 tabular-nums">
            {row.zoneOrTerminal ?? "—"}
          </td>
        );
      case "date":
        return (
          <td key={columnId} className="px-4 py-3 whitespace-nowrap tabular-nums">
            {formatDate(row.declarationDate)}
          </td>
        );
      case "containerCount":
        return (
          <td key={columnId} className="px-4 py-3 text-center tabular-nums">
            {row.containerCount != null && row.containerCount > 0
              ? row.containerCount
              : "—"}
          </td>
        );
      case "containers":
        return (
          <td key={columnId} className="max-w-[14rem] px-4 py-3">
            {row.containers.length > 0 ? (
              <span
                className="line-clamp-2 font-mono text-xs leading-relaxed"
                title={row.containers.join(", ")}
              >
                {row.containers.join(", ")}
              </span>
            ) : (
              "—"
            )}
          </td>
        );
      case "amount":
        return (
          <td key={columnId} className="px-4 py-3 text-right tabular-nums">
            {formatMoney(row.clientAmountPaid)}
          </td>
        );
      case "gainde":
        return (
          <td key={columnId} className="px-4 py-3 text-right tabular-nums">
            {formatMoney(row.gaindeDutyAmount)}
          </td>
        );
      case "cost":
        return (
          <td key={columnId} className="px-4 py-3 text-right tabular-nums">
            {formatMoney(row.costPrice)}
          </td>
        );
      case "reste":
        return (
          <td
            key={columnId}
            className="px-4 py-3 text-right tabular-nums text-muted-foreground"
          >
            {formatReste(row.clientAmountPaid, row.costPrice)}
          </td>
        );
      case "agency":
        return (
          <td key={columnId} className="px-4 py-3">
            {row.payingAgencyName ?? "—"}
          </td>
        );
      case "bad":
        return (
          <td key={columnId} className="px-4 py-3 text-center">
            {row.bonADelivrer ? (
              <Check
                className="mx-auto size-4 text-emerald-600"
                aria-label="Bon à délivrer"
              />
            ) : (
              <span className="text-muted-foreground">—</span>
            )}
          </td>
        );
      case "actions":
        return (
          <td
            key={columnId}
            className="px-4 py-3 text-right"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="inline-flex items-center gap-1">
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
              {canDelete ? (
                <DropdownMenu>
                  <DropdownMenuTrigger
                    onClick={(e) => e.stopPropagation()}
                    className={cn(
                      buttonVariants({ variant: "outline", size: "sm" }),
                      "px-2",
                    )}
                    aria-label="Plus d'options"
                  >
                    <MoreHorizontal className="size-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onSelect={() => onDelete?.(row)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="size-4" />
                      Supprimer
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : null}
            </div>
          </td>
        );
      default:
        return null;
    }
  }

  return (
    <div
      className={
        bare ? "overflow-x-auto" : "overflow-x-auto rounded-lg border bg-card"
      }
    >
      <table className="w-full min-w-[72rem] text-sm">
        <thead>
          <tr className="border-b bg-muted/40 text-left text-muted-foreground">
            {visibleColumnIds.map((id) => {
              const meta = HEADER[id];
              return (
                <th
                  key={id}
                  className={cn("px-4 py-3 font-medium", meta.className)}
                >
                  {meta.label}
                </th>
              );
            })}
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
              {visibleColumnIds.map((id) => renderCell(id, row))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
