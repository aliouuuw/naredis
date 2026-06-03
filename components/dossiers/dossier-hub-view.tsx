"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, FileText, FolderOpen, Wallet } from "lucide-react";
import { formatXof } from "@/lib/domain/balance";
import { computeDeclarationReste } from "@/lib/domain/declaration-reste";
import type { DossierHubSerialized } from "@/lib/modules/dossiers/serialize-hub";
import { DeclarationActivityFeed } from "@/components/declarations/declaration-activity-feed";
import { DossierCloseDialog } from "./dossier-close-dialog";

type TabId = "declarations" | "documents" | "finances" | "activite";

const CASE_STATUS_LABELS: Record<string, string> = {
  open: "Ouvert",
  on_hold: "En attente",
  closed: "Clôturé",
};

function formatMoney(value: string | null) {
  if (value == null) return "—";
  return `${formatXof(BigInt(value))} XOF`;
}

function formatBytes(size: string | null) {
  if (size == null) return "—";
  const n = Number(size);
  if (n < 1024) return `${n} o`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} Ko`;
  return `${(n / (1024 * 1024)).toFixed(1)} Mo`;
}

export function DossierHubView({
  hub,
  canClose,
}: {
  hub: DossierHubSerialized;
  canClose: boolean;
}) {
  const [tab, setTab] = useState<TabId>("declarations");
  const [closeOpen, setCloseOpen] = useState(false);

  const tabs: { id: TabId; label: string; count?: number }[] = [
    {
      id: "declarations",
      label: "Déclarations",
      count: hub.declarations.length,
    },
    { id: "documents", label: "Documents", count: hub.documents.length },
    { id: "finances", label: "Finances" },
    { id: "activite", label: "Activité", count: hub.activity.length },
  ];

  const isClosed = hub.dossier.caseStatus === "closed";

  return (
    <div className="space-y-6">
      <aside className="rounded-lg border bg-card p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Client
            </p>
            <p className="mt-1 font-semibold">
              <Link
                href={`/clients/${hub.dossier.customer.id}`}
                className="hover:underline"
              >
                {hub.dossier.customer.name}
              </Link>
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              BL {hub.dossier.blReference ?? "—"} ·{" "}
              {CASE_STATUS_LABELS[hub.dossier.caseStatus] ??
                hub.dossier.caseStatus}
            </p>
          </div>
          {canClose && !isClosed ? (
            <button
              type="button"
              onClick={() => setCloseOpen(true)}
              className="rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-muted"
            >
              Clôturer le dossier
            </button>
          ) : null}
        </div>
      </aside>

      <div
        role="tablist"
        aria-label="Sections du dossier"
        className="flex flex-wrap gap-1 border-b"
      >
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              tab === t.id
                ? "border-b-2 border-foreground text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
            {t.count != null && t.count > 0 ? (
              <span className="ml-1.5 tabular-nums text-muted-foreground">
                ({t.count})
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {tab === "declarations" ? (
        <section className="space-y-3">
          {hub.declarations.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aucune déclaration rattachée à ce dossier.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
                    <th className="px-4 py-2 font-medium">N° décl.</th>
                    <th className="px-4 py-2 font-medium">Date</th>
                    <th className="px-4 py-2 font-medium text-right">
                      Montant
                    </th>
                    <th className="px-4 py-2 font-medium text-right">
                      Reste
                    </th>
                    <th className="px-4 py-2 font-medium">BAD</th>
                  </tr>
                </thead>
                <tbody>
                  {hub.declarations.map((row) => {
                    const reste = computeDeclarationReste(
                      row.clientAmountPaid,
                      row.costPrice,
                    );
                    return (
                      <tr key={row.id} className="border-b last:border-0">
                        <td className="px-4 py-3">
                          <Link
                            href={`/declarations?open=${row.id}`}
                            className="font-medium hover:underline"
                          >
                            {row.declarationNumber}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {row.declarationDate ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          {formatMoney(
                            row.clientAmountPaid?.toString() ?? null,
                          )}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          {reste != null ? formatMoney(reste.toString()) : "—"}
                        </td>
                        <td className="px-4 py-3">
                          {row.bonADelivrer ? (
                            <span className="inline-flex items-center gap-1 text-emerald-600">
                              <Check className="size-3.5" />
                              Oui
                            </span>
                          ) : (
                            <span className="text-muted-foreground">Non</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ) : null}

      {tab === "documents" ? (
        <section className="space-y-3">
          {hub.documents.length === 0 ? (
            <div className="rounded-lg border border-dashed bg-muted/20 px-6 py-8 text-center text-sm text-muted-foreground">
              <FileText className="mx-auto size-5 opacity-60" />
              <p className="mt-2">Aucun document pour ce dossier.</p>
              <p className="mt-1 text-xs">
                L&apos;import de fichiers arrive avec DOS-002.
              </p>
            </div>
          ) : (
            <ul className="divide-y rounded-lg border bg-card">
              {hub.documents.map((doc) => (
                <li
                  key={doc.id}
                  className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm"
                >
                  <div>
                    <p className="font-medium">{doc.fileName}</p>
                    <p className="text-xs text-muted-foreground">
                      {doc.documentType}
                      {doc.mimeType ? ` · ${doc.mimeType}` : ""}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatBytes(doc.sizeBytes)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      {tab === "finances" ? (
        <section className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <article className="rounded-lg border bg-card p-4">
              <p className="text-xs text-muted-foreground">Total client</p>
              <p className="mt-1 text-lg font-semibold tabular-nums">
                {formatMoney(hub.finances.totalClientAmount)}
              </p>
            </article>
            <article className="rounded-lg border bg-card p-4">
              <p className="text-xs text-muted-foreground">Prix de revient</p>
              <p className="mt-1 text-lg font-semibold tabular-nums">
                {formatMoney(hub.finances.totalCostPrice)}
              </p>
            </article>
            <article className="rounded-lg border bg-card p-4">
              <p className="text-xs text-muted-foreground">Reste (marge)</p>
              <p className="mt-1 text-lg font-semibold tabular-nums">
                {formatMoney(hub.finances.reste)}
              </p>
            </article>
          </div>

          <div className="space-y-2">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <Wallet className="size-4 text-muted-foreground" />
              Écritures liées au dossier
            </h3>
            {hub.finances.ledgerRows.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Aucune écriture comptable directement rattachée à ce dossier.
              </p>
            ) : (
              <ul className="divide-y rounded-lg border bg-card text-sm">
                {hub.finances.ledgerRows.map((row) => (
                  <li
                    key={row.id}
                    className="flex flex-wrap items-center justify-between gap-2 px-4 py-3"
                  >
                    <div>
                      <p className="font-medium">{row.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {row.effectiveDate} · {row.entryType}
                      </p>
                    </div>
                    <span className="tabular-nums font-medium">
                      {formatMoney(row.amount)}{" "}
                      <span className="text-xs font-normal text-muted-foreground">
                        ({row.balanceSide === "debit" ? "débit" : "crédit"})
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      ) : null}

      {tab === "activite" ? (
        <section>
          <DeclarationActivityFeed entries={hub.activity} />
        </section>
      ) : null}

      <p className="text-sm text-muted-foreground">
        <Link href="/declarations" className="inline-flex items-center gap-1 hover:underline">
          <FolderOpen className="size-3.5" />
          ← Déclarations
        </Link>
      </p>

      <DossierCloseDialog
        open={closeOpen}
        onOpenChange={setCloseOpen}
        dossierId={hub.dossier.id}
        dossierNumber={hub.dossier.dossierNumber}
        warnings={hub.closeWarnings}
      />
    </div>
  );
}
