"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { formatXof } from "@/lib/domain/balance";
import type { ClientListColumnId } from "@/lib/ui/list-table-columns";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { CustomerListItemSerialized } from "@/lib/modules/customers/serialize-list";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const accountStatusLabel = {
  a_jour: "À jour",
  pas_a_jour: "Pas à jour",
} as const;

const HEADER: Record<
  ClientListColumnId,
  { label: ReactNode; className?: string }
> = {
  name: { label: "Client" },
  phone: { label: "Téléphone" },
  balance: { label: "Solde", className: "text-right" },
  fees: { label: "Frais dossiers", className: "text-right" },
  transactionsToday: { label: "Transactions jour", className: "text-right" },
  status: { label: "Statut" },
  actions: {
    label: <span className="sr-only">Actions</span>,
    className: "text-right",
  },
};

export function ClientsTable({
  rows,
  bare = false,
  visibleColumnIds,
  onEdit,
  onDelete,
}: {
  rows: CustomerListItemSerialized[];
  bare?: boolean;
  visibleColumnIds: ClientListColumnId[];
  onEdit?: (row: CustomerListItemSerialized) => void;
  onDelete?: (row: CustomerListItemSerialized) => void;
}) {
  const router = useRouter();

  function renderCell(columnId: ClientListColumnId, row: CustomerListItemSerialized) {
    const href = `/clients/${row.id}`;

    switch (columnId) {
      case "name":
        return (
          <td key={columnId} className="px-4 py-3">
            <span className="font-medium text-foreground">{row.name}</span>
            <p className="text-xs text-muted-foreground">{row.slug}</p>
          </td>
        );
      case "phone":
        return (
          <td key={columnId} className="px-4 py-3">
            {row.phone ?? "—"}
          </td>
        );
      case "balance":
        return (
          <td key={columnId} className="px-4 py-3 text-right tabular-nums">
            <span>{formatXof(BigInt(row.balanceAmount))} XOF</span>
            <span className="ml-1 text-xs text-muted-foreground">
              {row.balanceLabel}
            </span>
          </td>
        );
      case "fees":
        return (
          <td key={columnId} className="px-4 py-3 text-right tabular-nums">
            {formatXof(BigInt(row.feesAllTime))} XOF
          </td>
        );
      case "transactionsToday":
        return (
          <td key={columnId} className="px-4 py-3 text-right tabular-nums">
            {formatXof(BigInt(row.transactionsToday))} XOF
          </td>
        );
      case "status":
        return (
          <td key={columnId} className="px-4 py-3">
            <span
              className={cn(
                "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                row.accountStatus === "a_jour"
                  ? "bg-emerald-500/10 text-emerald-800 dark:text-emerald-300"
                  : "bg-amber-500/10 text-amber-800 dark:text-amber-300",
              )}
            >
              {accountStatusLabel[row.accountStatus]}
            </span>
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
              <Link
                href={href}
                onClick={(e) => e.stopPropagation()}
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "inline-flex gap-1",
                )}
              >
                Ouvrir
                <ChevronRight className="size-4" aria-hidden />
              </Link>
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
                    onSelect={() => onEdit?.(row)}
                  >
                    <Pencil className="size-4" />
                    Modifier
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onSelect={() => onDelete?.(row)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="size-4" />
                    Supprimer
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
      <table className="w-full min-w-[720px] text-sm">
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
          {rows.map((row) => {
            const href = `/clients/${row.id}`;
            return (
              <tr
                key={row.id}
                tabIndex={0}
                role="link"
                aria-label={`Ouvrir le client ${row.name}`}
                className="cursor-pointer transition-colors hover:bg-muted/40 focus-visible:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                onClick={() => router.push(href)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    router.push(href);
                  }
                }}
              >
                {visibleColumnIds.map((id) => renderCell(id, row))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
