"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, Plus } from "lucide-react";
import { formatBalanceLabel, formatXof } from "@/lib/domain/balance";
import type { CustomerAccountStatus } from "@/lib/db/enums";
import type {
  LedgerEntrySerialized,
  TransactionTypeSerialized,
} from "@/lib/modules/ledger/serialize";
import type { DossierAllocationOption } from "@/lib/modules/ledger/service";
import type { DeclarationListItemSerialized } from "@/lib/modules/declarations/serialize-list";
import { AccountStatusControl } from "./account-status-control";
import { LedgerEntriesTable } from "@/components/transactions/ledger-entries-table";
import { RecordTransactionDialog } from "@/components/transactions/record-transaction-dialog";
import { Button, ButtonLink } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const TAB_IDS = ["resume", "transactions", "declarations"] as const;
type TabId = (typeof TAB_IDS)[number];

function isTabId(value: string | null): value is TabId {
  return TAB_IDS.includes(value as TabId);
}

const accountStatusLabel = {
  a_jour: "Comptes à jour",
  pas_a_jour: "Comptes pas à jour",
} as const;

export function CustomerFicheView({
  customer,
  balance,
  dayOpenBalance,
  feesAllTime,
  transactionsToday,
  ledgerEntries,
  dossiers,
  declarations,
  transactionTypes,
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
  transactionTypes: TransactionTypeSerialized[];
  canRecordLedger: boolean;
  initialTab?: TabId;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const openRecord = searchParams.get("record") === "1";
  const [recordDialogOpen, setRecordDialogOpen] = useState(false);
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
  ];

  const balanceTone =
    balance.side === "debit"
      ? "text-amber-800 dark:text-amber-300"
      : "text-emerald-800 dark:text-emerald-400";

  return (
    <div className="space-y-6">
      <section className="rounded-xl border bg-card">
        <div className="border-b px-5 py-5 md:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 space-y-1">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Compte client
              </p>
              <h1 className="text-2xl font-semibold tracking-tight">
                {customer.name}
              </h1>
              <p className="text-sm text-muted-foreground">
                <span className="font-mono text-xs">{customer.slug}</span>
                {customer.phone ? (
                  <>
                    {" "}
                    ·{" "}
                    <a
                      href={`tel:${customer.phone}`}
                      className="hover:text-foreground hover:underline"
                    >
                      {customer.phone}
                    </a>
                  </>
                ) : null}
              </p>
              <p
                className={cn(
                  "text-xs font-medium",
                  customer.accountStatus === "a_jour"
                    ? "text-emerald-700 dark:text-emerald-400"
                    : "text-amber-700 dark:text-amber-400",
                )}
              >
                {accountStatusLabel[customer.accountStatus]}
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
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
          </div>
        </div>

        <div className="grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-card p-4 sm:col-span-2 lg:col-span-1">
            <p className="text-xs font-medium text-muted-foreground">Solde</p>
            <p className={cn("mt-1 text-2xl font-semibold tabular-nums", balanceTone)}>
              {formatXof(BigInt(balance.amount))}{" "}
              <span className="text-base font-medium">XOF</span>
            </p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {formatBalanceLabel(balance.side)}
            </p>
          </div>
          <div className="bg-card p-4">
            <p className="text-xs font-medium text-muted-foreground">
              Report (ouverture jour)
            </p>
            <p className="mt-1 text-lg font-semibold tabular-nums">
              {formatXof(BigInt(dayOpenBalance.amount))} XOF
            </p>
            <p className="text-xs text-muted-foreground">
              {formatBalanceLabel(dayOpenBalance.side)}
            </p>
          </div>
          <div className="bg-card p-4">
            <p className="text-xs font-medium text-muted-foreground">
              Frais dossiers (total)
            </p>
            <p className="mt-1 text-lg font-semibold tabular-nums">
              {formatXof(BigInt(feesAllTime))} XOF
            </p>
          </div>
          <div className="bg-card p-4">
            <p className="text-xs font-medium text-muted-foreground">
              Transactions aujourd&apos;hui
            </p>
            <p className="mt-1 text-lg font-semibold tabular-nums">
              {formatXof(BigInt(transactionsToday))} XOF
            </p>
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
        <section className="rounded-lg border bg-card p-5">
          <h2 className="text-sm font-semibold">Coordonnées et statut</h2>
          <dl className="mt-4 grid max-w-xl gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">Téléphone</dt>
              <dd className="mt-1 font-medium">{customer.phone ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Identifiant</dt>
              <dd className="mt-1 font-mono text-xs">{customer.slug}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-muted-foreground">Statut compte (réconciliation)</dt>
              <dd className="mt-2">
                <AccountStatusControl
                  customerId={customer.id}
                  value={customer.accountStatus}
                  canEdit={canRecordLedger}
                />
              </dd>
            </div>
          </dl>
        </section>
      ) : null}

      {tab === "transactions" ? (
        <div className="space-y-4">
          {canRecordLedger ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm text-muted-foreground">
                  Historique des écritures pour ce compte.
                </p>
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
              <RecordTransactionDialog
                open={recordDialogOpen}
                onOpenChange={setRecordDialogOpen}
                customerId={customer.id}
                customerName={customer.name}
                dossiers={dossiers}
                transactionTypes={transactionTypes}
              />
            </>
          ) : (
            <p className="rounded-lg border border-dashed bg-muted/30 px-4 py-6 text-center text-sm text-muted-foreground">
              Vous n&apos;avez pas les droits pour enregistrer une transaction.
            </p>
          )}
          <section>
            <LedgerEntriesTable rows={ledgerEntries} />
          </section>
        </div>
      ) : null}

      {tab === "declarations" ? (
        <section className="overflow-hidden rounded-lg border bg-card">
          <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
            <h2 className="text-sm font-semibold">Déclarations</h2>
            <ButtonLink
              href="/declarations/new"
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
    </div>
  );
}
