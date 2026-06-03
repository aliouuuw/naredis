"use client";

import Link from "next/link";
import { useState } from "react";
import { Check } from "lucide-react";
import { formatBalanceLabel, formatXof } from "@/lib/domain/balance";
import type { CustomerAccountStatus } from "@/lib/db/enums";
import type { LedgerEntrySerialized } from "@/lib/modules/ledger/serialize";
import type { DossierAllocationOption } from "@/lib/modules/ledger/service";
import type { DeclarationListItemSerialized } from "@/lib/modules/declarations/serialize-list";
import { LedgerEntriesTable } from "./ledger-entries-table";
import { RecordVersementForm } from "./record-versement-form";

type TabId = "resume" | "comptabilite" | "declarations";

const accountStatusLabel = {
  a_jour: "À jour",
  pas_a_jour: "Pas à jour",
} as const satisfies Record<CustomerAccountStatus, string>;

export function CustomerFicheTabs({
  customer,
  balance,
  dayOpenBalance,
  feesAllTime,
  transactionsToday,
  ledgerEntries,
  dossiers,
  declarations,
  canRecordLedger,
  initialTab,
}: {
  customer: {
    id: string;
    name: string;
    slug: string;
    phone: string | null;
    accountStatus: CustomerAccountStatus;
  };
  balance: { amount: string; side: "debit" | "credit" };
  dayOpenBalance: { amount: string; side: "debit" | "credit" };
  feesAllTime: string;
  transactionsToday: string;
  ledgerEntries: LedgerEntrySerialized[];
  dossiers: DossierAllocationOption[];
  declarations: DeclarationListItemSerialized[];
  canRecordLedger: boolean;
  initialTab?: TabId;
}) {
  const [tab, setTab] = useState<TabId>(initialTab ?? "resume");

  const tabs: { id: TabId; label: string }[] = [
    { id: "resume", label: "Résumé" },
    { id: "comptabilite", label: "Comptabilité" },
    { id: "declarations", label: "Déclarations" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 border-b pb-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={
              tab === t.id
                ? "rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground"
                : "rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted"
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "resume" ? (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border bg-card p-4">
              <p className="text-xs text-muted-foreground">Solde</p>
              <p className="mt-1 text-lg font-semibold tabular-nums">
                {formatXof(BigInt(balance.amount))} XOF
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  {formatBalanceLabel(balance.side)}
                </span>
              </p>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <p className="text-xs text-muted-foreground">
                Report (ouverture jour)
              </p>
              <p className="mt-1 text-lg font-semibold tabular-nums">
                {formatXof(BigInt(dayOpenBalance.amount))} XOF
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  {formatBalanceLabel(dayOpenBalance.side)}
                </span>
              </p>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <p className="text-xs text-muted-foreground">
                Frais dossiers (total)
              </p>
              <p className="mt-1 text-lg font-semibold tabular-nums">
                {formatXof(BigInt(feesAllTime))} XOF
              </p>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <p className="text-xs text-muted-foreground">
                Transactions aujourd&apos;hui
              </p>
              <p className="mt-1 text-lg font-semibold tabular-nums">
                {formatXof(BigInt(transactionsToday))} XOF
              </p>
            </div>
          </div>

          <dl className="grid max-w-lg gap-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Téléphone</dt>
              <dd>{customer.phone ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Statut compte</dt>
              <dd>{accountStatusLabel[customer.accountStatus]}</dd>
            </div>
          </dl>
        </div>
      ) : null}

      {tab === "comptabilite" ? (
        <div className="space-y-6">
          {canRecordLedger ? (
            <RecordVersementForm
              customerId={customer.id}
              dossiers={dossiers}
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              Vous n&apos;avez pas les droits pour enregistrer un versement.
            </p>
          )}
          <div>
            <h3 className="mb-3 text-sm font-semibold">Écritures</h3>
            <LedgerEntriesTable rows={ledgerEntries} />
          </div>
        </div>
      ) : null}

      {tab === "declarations" ? (
        <div className="overflow-x-auto rounded-lg border bg-card">
          {declarations.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              Aucune déclaration pour ce client.
            </p>
          ) : (
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-left text-muted-foreground">
                  <th className="px-4 py-3 font-medium">N° décl.</th>
                  <th className="px-4 py-3 font-medium">BL</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">BAD</th>
                  <th className="px-4 py-3 font-medium" />
                </tr>
              </thead>
              <tbody className="divide-y">
                {declarations.map((row) => (
                  <tr key={row.id}>
                    <td className="px-4 py-3 font-mono">
                      {row.declarationNumber}
                    </td>
                    <td className="px-4 py-3 font-mono">
                      {row.blReference ?? "—"}
                    </td>
                    <td className="px-4 py-3">{row.declarationDate ?? "—"}</td>
                    <td className="px-4 py-3">
                      {row.bonADelivrer ? (
                        <Check
                          className="size-4 text-emerald-600"
                          aria-label="Bon à délivrer"
                        />
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/declarations?open=${row.id}`}
                        className="text-sm font-medium hover:underline"
                      >
                        Ouvrir
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ) : null}
    </div>
  );
}
