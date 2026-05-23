import Link from "next/link";
import { formatXof } from "@/lib/domain/balance";
import type { CustomerListItem } from "@/lib/modules/customers/service";

const accountStatusLabel = {
  a_jour: "À jour",
  pas_a_jour: "Pas à jour",
} as const;

export function ClientsTable({ rows }: { rows: CustomerListItem[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border bg-card">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-b bg-muted/40 text-left text-muted-foreground">
            <th className="px-4 py-3 font-medium">Client</th>
            <th className="px-4 py-3 font-medium">Téléphone</th>
            <th className="px-4 py-3 font-medium text-right">Solde</th>
            <th className="px-4 py-3 font-medium text-right">Frais dossiers</th>
            <th className="px-4 py-3 font-medium text-right">Transactions jour</th>
            <th className="px-4 py-3 font-medium">Statut</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {rows.map((row) => (
            <tr key={row.id} className="hover:bg-muted/30">
              <td className="px-4 py-3">
                <Link
                  href={`/clients/${row.id}`}
                  className="font-medium hover:underline"
                >
                  {row.name}
                </Link>
                <p className="text-xs text-muted-foreground">{row.slug}</p>
              </td>
              <td className="px-4 py-3">{row.phone ?? "—"}</td>
              <td className="px-4 py-3 text-right tabular-nums">
                <span>{formatXof(row.balanceAmount)} XOF</span>
                <span className="ml-1 text-xs text-muted-foreground">
                  {row.balanceLabel}
                </span>
              </td>
              <td className="px-4 py-3 text-right tabular-nums">
                {formatXof(row.feesAllTime)} XOF
              </td>
              <td className="px-4 py-3 text-right tabular-nums">
                {formatXof(row.transactionsToday)} XOF
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
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
