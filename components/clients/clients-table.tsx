"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { formatXof } from "@/lib/domain/balance";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { CustomerListItemSerialized } from "@/lib/modules/customers/serialize-list";

const accountStatusLabel = {
  a_jour: "À jour",
  pas_a_jour: "Pas à jour",
} as const;

export function ClientsTable({ rows }: { rows: CustomerListItemSerialized[] }) {
  const router = useRouter();

  return (
    <div className="overflow-x-auto rounded-lg border bg-card">
      <table className="w-full min-w-[720px] text-sm">
        <thead>
          <tr className="border-b bg-muted/40 text-left text-muted-foreground">
            <th className="px-4 py-3 font-medium">Client</th>
            <th className="px-4 py-3 font-medium">Téléphone</th>
            <th className="px-4 py-3 font-medium text-right">Solde</th>
            <th className="px-4 py-3 font-medium text-right">Frais dossiers</th>
            <th className="px-4 py-3 font-medium text-right">Transactions jour</th>
            <th className="px-4 py-3 font-medium">Statut</th>
            <th className="px-4 py-3 font-medium text-right">
              <span className="sr-only">Actions</span>
            </th>
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
                <td className="px-4 py-3">
                  <span className="font-medium text-foreground">{row.name}</span>
                  <p className="text-xs text-muted-foreground">{row.slug}</p>
                </td>
                <td className="px-4 py-3">{row.phone ?? "—"}</td>
                <td className="px-4 py-3 text-right tabular-nums">
                  <span>{formatXof(BigInt(row.balanceAmount))} XOF</span>
                  <span className="ml-1 text-xs text-muted-foreground">
                    {row.balanceLabel}
                  </span>
                </td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {formatXof(BigInt(row.feesAllTime))} XOF
                </td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {formatXof(BigInt(row.transactionsToday))} XOF
                </td>
                <td className="px-4 py-3">
                  <span
                    className={
                      row.accountStatus === "a_jour"
                        ? "text-emerald-700 dark:text-emerald-400"
                        : "text-amber-700 dark:text-amber-400"
                    }
                  >
                    {accountStatusLabel[row.accountStatus]}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={href}
                    onClick={(event) => event.stopPropagation()}
                    className={cn(
                      buttonVariants({ variant: "outline", size: "sm" }),
                      "inline-flex gap-1",
                    )}
                  >
                    Ouvrir
                    <ChevronRight className="size-4" aria-hidden />
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
