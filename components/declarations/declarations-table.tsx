import Link from "next/link";
import { Check } from "lucide-react";
import { formatXof } from "@/lib/domain/balance";
import type { DeclarationListItem } from "@/lib/modules/declarations/service";

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("fr-FR").format(new Date(value));
}

function formatMoney(value: bigint | null) {
  if (value == null) return "—";
  return `${formatXof(value)} XOF`;
}

export function DeclarationsTable({ rows }: { rows: DeclarationListItem[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border bg-card">
      <table className="w-full min-w-[720px] text-sm">
        <thead>
          <tr className="border-b bg-muted/40 text-left text-muted-foreground">
            <th className="px-4 py-3 font-medium">N°</th>
            <th className="px-4 py-3 font-medium">Client</th>
            <th className="px-4 py-3 font-medium">BL</th>
            <th className="px-4 py-3 font-medium">Zone</th>
            <th className="px-4 py-3 font-medium">Date</th>
            <th className="px-4 py-3 font-medium text-right">Montant</th>
            <th className="px-4 py-3 font-medium text-center">BAD</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {rows.map((row) => (
            <tr key={row.id} className="hover:bg-muted/30">
              <td className="px-4 py-3">
                <Link
                  href={`/declarations/${row.id}`}
                  className="font-medium text-foreground hover:underline"
                >
                  {row.declarationNumber}
                </Link>
              </td>
              <td className="px-4 py-3">
                <span className="text-muted-foreground">{row.customerSlug}</span>
                <span className="mx-1 text-muted-foreground/50">·</span>
                {row.customerName}
              </td>
              <td className="px-4 py-3 font-mono text-xs">{row.blReference ?? "—"}</td>
              <td className="px-4 py-3">{row.zoneOrTerminal ?? "—"}</td>
              <td className="px-4 py-3">{formatDate(row.declarationDate)}</td>
              <td className="px-4 py-3 text-right tabular-nums">
                {formatMoney(row.clientAmountPaid)}
              </td>
              <td className="px-4 py-3 text-center">
                {row.bonADelivrer ? (
                  <Check className="mx-auto size-4 text-emerald-600" aria-label="Bon à délivrer" />
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
