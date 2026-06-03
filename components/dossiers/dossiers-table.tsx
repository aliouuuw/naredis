import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { DossierListItem } from "@/lib/modules/dossiers/service";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const CASE_STATUS_LABELS: Record<string, string> = {
  open: "Ouvert",
  on_hold: "En attente",
  closed: "Clôturé",
};

export function DossiersTable({ rows }: { rows: DossierListItem[] }) {
  if (rows.length === 0) {
    return (
      <p className="rounded-lg border border-dashed bg-muted/30 px-6 py-10 text-center text-sm text-muted-foreground">
        Aucun dossier pour cette organisation.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border bg-card">
      <table className="w-full min-w-[720px] text-sm">
        <thead>
          <tr className="border-b bg-muted/40 text-left text-muted-foreground">
            <th className="px-4 py-3 font-medium">N° dossier</th>
            <th className="px-4 py-3 font-medium">Client</th>
            <th className="px-4 py-3 font-medium">BL</th>
            <th className="px-4 py-3 font-medium">Statut</th>
            <th className="px-4 py-3 font-medium text-right">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {rows.map((row) => (
            <tr key={row.id} className="hover:bg-muted/30">
              <td className="px-4 py-3 font-mono text-xs font-medium">
                <Link
                  href={`/dossiers/${row.id}`}
                  className="hover:underline"
                >
                  {row.dossierNumber}
                </Link>
              </td>
              <td className="px-4 py-3">
                <Link
                  href={`/clients/${row.customerId}`}
                  className="hover:underline"
                >
                  {row.customerName}
                </Link>
              </td>
              <td className="px-4 py-3 font-mono text-xs">
                {row.blReference ?? "—"}
              </td>
              <td className="px-4 py-3">
                {CASE_STATUS_LABELS[row.caseStatus] ?? row.caseStatus}
              </td>
              <td className="px-4 py-3 text-right">
                <Link
                  href={`/dossiers/${row.id}`}
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
          ))}
        </tbody>
      </table>
    </div>
  );
}
