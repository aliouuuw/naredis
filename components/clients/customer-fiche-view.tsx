"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, Plus } from "lucide-react";
import {
  describeBalanceSide,
  formatBalanceStatement,
  formatXof,
} from "@/lib/domain/balance";
import type { CustomerAccountStatus } from "@/lib/db/enums";
import type {
  LedgerEntrySerialized,
  TransactionTypeSerialized,
} from "@/lib/modules/ledger/serialize";
import type { DossierAllocationOption } from "@/lib/modules/ledger/service";
import type { ActivityLogEntrySerialized } from "@/lib/modules/declarations/serialize-fiche";
import type { DeclarationListItemSerialized } from "@/lib/modules/declarations/serialize-list";
import { DashboardActivityFeed } from "@/components/dashboard/dashboard-activity-feed";
import { ledgerSectionCopy } from "@/components/ledger/ledger-table-styles";
import { AccountStatusControl } from "./account-status-control";
import { CustomerAccountLedger } from "@/components/clients/customer-account-ledger";
import { LedgerEntriesTable } from "@/components/transactions/ledger-entries-table";
import { OpeningBalanceDialog } from "@/components/transactions/opening-balance-dialog";
import { RecordTransactionDialog } from "@/components/transactions/record-transaction-dialog";
import { ReverseEntryDialog } from "@/components/transactions/reverse-entry-dialog";
import { Button, ButtonLink } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const ledgerCopy = ledgerSectionCopy();

const TAB_IDS = ["resume", "transactions", "declarations", "activite"] as const;
type TabId = (typeof TAB_IDS)[number];

function isTabId(value: string | null): value is TabId {
  return TAB_IDS.includes(value as TabId);
}

export function CustomerFicheView({
  customer,
  balance,
  dayOpenBalance,
  feesAllTime,
  transactionsToday,
  ledgerEntries,
  dossiers,
  declarations,
  activityLog,
  transactionTypes,
  canRecordLedger,
  hasOpeningBalance,
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
  activityLog: ActivityLogEntrySerialized[];
  transactionTypes: TransactionTypeSerialized[];
  canRecordLedger: boolean;
  hasOpeningBalance: boolean;
  initialTab?: TabId;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const openRecord = searchParams.get("record") === "1";
  const [recordDialogOpen, setRecordDialogOpen] = useState(false);
  const [openingDialogOpen, setOpeningDialogOpen] = useState(false);
  const [reverseEntry, setReverseEntry] =
    useState<LedgerEntrySerialized | null>(null);
  const tabFromUrl = searchParams.get("tab");
  const tab: TabId = isTabId(tabFromUrl)
    ? tabFromUrl
    : openRecord
      ? "transactions"
      : (initialTab ?? "resume");

  const setQuery = useCallback(
    (patch: { tab?: TabId; record?: boolean | null }) => {
      const sp = new URLSearchParams(searchParams.toString());
      if (patch.tab !== undefined) {
        if (patch.tab === "resume") sp.delete("tab");
        else sp.set("tab", patch.tab);
      }
      if (patch.record === true) sp.set("record", "1");
      else if (patch.record === false || patch.record === null) {
        sp.delete("record");
      }
      const qs = sp.toString();
      router.replace(
        qs ? `/clients/${customer.id}?${qs}` : `/clients/${customer.id}`,
        { scroll: false },
      );
    },
    [customer.id, router, searchParams],
  );

  const openRecordDialog = useCallback(() => {
    setQuery({ tab: "transactions", record: null });
    setRecordDialogOpen(true);
  }, [setQuery]);

  useEffect(() => {
    if (!openRecord) return;
    setRecordDialogOpen(true);
    setQuery({ tab: "transactions", record: null });
  }, [openRecord, setQuery]);

  const tabs: { id: TabId; label: string; count?: number }[] = [
    { id: "resume", label: "Résumé" },
    {
      id: "transactions",
      label: "Transactions",
      count: ledgerEntries.length,
    },
    {
      id: "declarations",
      label: "Déclarations",
      count: declarations.length,
    },
    { id: "activite", label: "Activité", count: activityLog.length },
  ];

  const balanceBig = {
    amount: BigInt(balance.amount),
    side: balance.side,
  };
  const dayOpenBig = {
    amount: BigInt(dayOpenBalance.amount),
    side: dayOpenBalance.side,
  };

  const balanceTone =
    balance.side === "debit"
      ? "text-amber-900 dark:text-amber-200"
      : balance.amount === "0"
        ? "text-muted-foreground"
        : "text-emerald-900 dark:text-emerald-200";

  return (
    <div className="space-y-6">
      <section className="rounded-xl border bg-card">
        <div className="px-5 py-5 md:px-6 md:py-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 flex-1 space-y-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Compte client
                </p>
                <h1 className="mt-1 text-2xl font-semibold tracking-tight">
                  {customer.name}
                </h1>
              </div>

              <dl className="grid gap-3 text-sm sm:grid-cols-2 lg:max-w-xl">
                <div>
                  <dt className="text-xs text-muted-foreground">Identifiant</dt>
                  <dd className="mt-0.5 font-mono text-xs">{customer.slug}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Téléphone</dt>
                  <dd className="mt-0.5 font-medium">
                    {customer.phone ? (
                      <a
                        href={`tel:${customer.phone}`}
                        className="hover:underline"
                      >
                        {customer.phone}
                      </a>
                    ) : (
                      "—"
                    )}
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-xs text-muted-foreground">
                    Réconciliation comptable
                  </dt>
                  <dd className="mt-1.5">
                    <AccountStatusControl
                      customerId={customer.id}
                      value={customer.accountStatus}
                      canEdit={canRecordLedger}
                    />
                  </dd>
                </div>
              </dl>
            </div>

            <div className="flex shrink-0 flex-col gap-4 lg:items-end">
              <div className="flex flex-wrap gap-2 lg:justify-end">
                {canRecordLedger ? (
                  <Button
                    type="button"
                    className="rounded-full"
                    onClick={openRecordDialog}
                  >
                    <Plus className="size-4" />
                    Nouvelle transaction
                  </Button>
                ) : null}
                <ButtonLink
                  href={`/transactions?f=customer%3Aeq%3A${encodeURIComponent(customer.id)}&preset=last30`}
                  variant="outline"
                  className="rounded-full"
                >
                  Vue globale
                </ButtonLink>
              </div>

              <div className="w-full min-w-[min(100%,16rem)] rounded-lg border bg-muted/25 px-5 py-4 lg:text-right">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Solde courant
                </p>
                <p
                  className={cn(
                    "mt-1 text-3xl font-semibold tabular-nums tracking-tight",
                    balanceTone,
                  )}
                >
                  {formatXof(balanceBig.amount)}{" "}
                  <span className="text-lg font-medium">XOF</span>
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {describeBalanceSide(balanceBig)}
                  <span className="mx-1.5 text-border">·</span>
                  <span className="text-xs">
                    {balance.side === "debit"
                      ? "Le client doit à l'agence"
                      : balance.amount === "0"
                        ? "Compte soldé"
                        : "L'agence doit au client"}
                  </span>
                </p>
                <p className="mt-2 text-[11px] text-muted-foreground/90">
                  Calculé sur le grand livre (débit − crédit). Se met à jour
                  après chaque écriture enregistrée.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <nav
        aria-label="Sections du compte client"
        className="flex gap-1 overflow-x-auto border-b"
      >
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setQuery({ tab: t.id, record: null })}
            className={cn(
              "inline-flex items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-medium whitespace-nowrap transition-colors",
              tab === t.id
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
            {t.count !== undefined ? (
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-xs tabular-nums",
                  tab === t.id
                    ? "bg-primary/10 text-primary"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {t.count}
              </span>
            ) : null}
          </button>
        ))}
      </nav>

      {tab === "resume" ? (
        <div className="space-y-6">
          <section className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border bg-card p-4">
              <p className="text-xs font-medium text-muted-foreground">
                Report à l&apos;ouverture (aujourd&apos;hui)
              </p>
              <p className="mt-2 text-lg font-semibold tabular-nums">
                {formatBalanceStatement(dayOpenBig)}
              </p>
              <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
                Solde du compte avant les écritures du jour (fuseau de
                l&apos;agence).
              </p>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <p className="text-xs font-medium text-muted-foreground">
                Frais dossiers (cumul)
              </p>
              <p className="mt-2 text-lg font-semibold tabular-nums">
                {formatXof(BigInt(feesAllTime))} XOF
              </p>
              <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
                Somme des prix de revient sur les déclarations.
              </p>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <p className="text-xs font-medium text-muted-foreground">
                Mouvements du jour
              </p>
              <p className="mt-2 text-lg font-semibold tabular-nums">
                {formatXof(BigInt(transactionsToday))} XOF
              </p>
              <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
                Volume des écritures enregistrées aujourd&apos;hui (tous types).
              </p>
            </div>
          </section>

          <section className="space-y-3">
            <div>
              <h2 className="text-sm font-semibold">{ledgerCopy.title}</h2>
              <p className="mt-1 max-w-2xl text-xs text-muted-foreground">
                {ledgerCopy.description}
              </p>
            </div>
            <CustomerAccountLedger
              ledgerEntries={ledgerEntries}
              declarations={declarations}
            />
          </section>
        </div>
      ) : null}

      {tab === "transactions" ? (
        <div className="space-y-4">
          {canRecordLedger ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0 max-w-2xl">
                  <p className="text-sm font-medium">{ledgerCopy.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {ledgerCopy.transactionsDescription}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {!hasOpeningBalance ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-full"
                      onClick={() => setOpeningDialogOpen(true)}
                    >
                      Solde d&apos;ouverture
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-full"
                    onClick={() => setRecordDialogOpen(true)}
                  >
                    <Plus className="size-3.5" />
                    Nouvelle transaction
                  </Button>
                </div>
              </div>
              <OpeningBalanceDialog
                open={openingDialogOpen}
                onOpenChange={setOpeningDialogOpen}
                customerId={customer.id}
                customerName={customer.name}
              />
              <RecordTransactionDialog
                open={recordDialogOpen}
                onOpenChange={setRecordDialogOpen}
                customerId={customer.id}
                customerName={customer.name}
                dossiers={dossiers}
                transactionTypes={transactionTypes}
              />
              <ReverseEntryDialog
                open={reverseEntry != null}
                onOpenChange={(open) => {
                  if (!open) setReverseEntry(null);
                }}
                entry={reverseEntry}
              />
            </>
          ) : (
            <p className="rounded-lg border border-dashed bg-muted/30 px-4 py-6 text-center text-sm text-muted-foreground">
              Vous n&apos;avez pas les droits pour enregistrer une transaction.
            </p>
          )}
          <section>
            <LedgerEntriesTable
              rows={ledgerEntries}
              canReverse={canRecordLedger}
              onReverse={(entry) => setReverseEntry(entry)}
            />
          </section>
        </div>
      ) : null}

      {tab === "declarations" ? (
        <section className="overflow-hidden rounded-lg border bg-card">
          <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
            <h2 className="text-sm font-semibold">Déclarations</h2>
            <ButtonLink
              href={`/declarations?new=1&customer=${customer.id}`}
              variant="outline"
              size="sm"
              className="rounded-full"
            >
              <Plus className="size-3.5" />
              Nouvelle déclaration
            </ButtonLink>
          </div>
          {declarations.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-muted-foreground">
              Aucune déclaration pour ce client.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="border-b bg-muted/40 text-left text-muted-foreground">
                    <th className="px-4 py-3 font-medium">N° décl.</th>
                    <th className="px-4 py-3 font-medium">Dossier</th>
                    <th className="px-4 py-3 font-medium">BL</th>
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium">BAD</th>
                    <th className="px-4 py-3 font-medium text-right"> </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {declarations.map((row) => (
                    <tr key={row.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3 font-mono text-xs">
                        {row.declarationNumber}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">
                        <Link
                          href={`/dossiers/${row.dossierId}`}
                          className="font-medium hover:underline"
                        >
                          {row.dossierNumber}
                        </Link>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">
                        {row.blReference ?? "—"}
                      </td>
                      <td className="px-4 py-3 tabular-nums">
                        {row.declarationDate ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        {row.bonADelivrer ? (
                          <Check
                            className="size-4 text-emerald-600"
                            aria-label="Bon à délivrer"
                          />
                        ) : (
                          <span className="text-muted-foreground">—</span>
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
            </div>
          )}
        </section>
      ) : null}

      {tab === "activite" ? (
        <section className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Événements enregistrés pour ce client, ses dossiers, déclarations et
            écritures comptables.
          </p>
          <DashboardActivityFeed entries={activityLog} />
        </section>
      ) : null}
    </div>
  );
}
