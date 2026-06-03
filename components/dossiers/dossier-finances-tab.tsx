"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Wallet } from "lucide-react";
import { formatBalanceLabel, formatXof } from "@/lib/domain/balance";
import { dossierResteLabel } from "@/lib/modules/dossiers/finances";
import type { DossierHubSerialized } from "@/lib/modules/dossiers/serialize-hub";
import type { TransactionTypeSerialized } from "@/lib/modules/ledger/serialize";
import { LedgerEntriesTable } from "@/components/transactions/ledger-entries-table";
import { Button } from "@/components/ui/button";
import { DossierChargeDialog } from "./dossier-charge-dialog";

function formatMoney(value: string) {
  return `${formatXof(BigInt(value))} XOF`;
}

export function DossierFinancesTab({
  hub,
  canRecordLedger,
  transactionTypes,
}: {
  hub: DossierHubSerialized;
  canRecordLedger: boolean;
  transactionTypes: TransactionTypeSerialized[];
}) {
  const [chargeOpen, setChargeOpen] = useState(false);
  const { filing, ledger, ledgerEntries } = hub.finances;

  const ledgerSummary = {
    charges: BigInt(ledger.charges),
    paye: BigInt(ledger.paye),
    reste: BigInt(ledger.reste),
    surplus: BigInt(ledger.surplus),
  };
  const resteDisplay = dossierResteLabel(ledgerSummary);

  return (
    <section className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">Compte dossier</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Charges et versements affectés à ce BL (écritures comptables).
          </p>
        </div>
        {canRecordLedger ? (
          <Button
            type="button"
            size="sm"
            className="gap-1"
            onClick={() => setChargeOpen(true)}
          >
            <Plus className="size-3.5" aria-hidden />
            Ajouter une charge
          </Button>
        ) : (
          <p className="text-xs text-muted-foreground">
            Lecture seule — réservé aux rôles comptabilité.
          </p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <article className="rounded-lg border bg-card p-4">
          <p className="text-xs text-muted-foreground">Charges</p>
          <p className="mt-1 text-lg font-semibold tabular-nums text-amber-900 dark:text-amber-200">
            {formatMoney(ledger.charges)}
          </p>
        </article>
        <article className="rounded-lg border bg-card p-4">
          <p className="text-xs text-muted-foreground">Payé</p>
          <p className="mt-1 text-lg font-semibold tabular-nums text-emerald-900 dark:text-emerald-200">
            {formatMoney(ledger.paye)}
          </p>
        </article>
        <article className="rounded-lg border bg-card p-4">
          <p className="text-xs text-muted-foreground">Reste dossier</p>
          <p className="mt-1 text-lg font-semibold tabular-nums">
            {resteDisplay.side === "settled"
              ? "Équilibré"
              : `${formatXof(resteDisplay.amount)} XOF · ${formatBalanceLabel(resteDisplay.side)}`}
          </p>
        </article>
      </div>

      <div className="space-y-2">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <Wallet className="size-4 text-muted-foreground" />
          Écritures
        </h3>
        <LedgerEntriesTable rows={ledgerEntries} showCustomer={false} />
        {canRecordLedger ? (
          <p className="text-xs text-muted-foreground">
            Versements et affectations :{" "}
            <Link
              href={`/clients/${hub.dossier.customer.id}?tab=transactions`}
              className="font-medium hover:underline"
            >
              fiche client → Transactions
            </Link>
          </p>
        ) : null}
      </div>

      <div className="space-y-2 border-t pt-6">
        <h3 className="text-sm font-semibold text-muted-foreground">
          Montants déclarations (fiche douane)
        </h3>
        <p className="text-xs text-muted-foreground">
          Informatif — ne remplace pas le compte client ci-dessus.
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          <article className="rounded-lg border bg-muted/20 p-4">
            <p className="text-xs text-muted-foreground">Total client</p>
            <p className="mt-1 font-semibold tabular-nums">
              {formatMoney(filing.totalClientAmount)}
            </p>
          </article>
          <article className="rounded-lg border bg-muted/20 p-4">
            <p className="text-xs text-muted-foreground">Prix de revient</p>
            <p className="mt-1 font-semibold tabular-nums">
              {formatMoney(filing.totalCostPrice)}
            </p>
          </article>
          <article className="rounded-lg border bg-muted/20 p-4">
            <p className="text-xs text-muted-foreground">Reste (marge)</p>
            <p className="mt-1 font-semibold tabular-nums">
              {formatMoney(filing.reste)}
            </p>
          </article>
        </div>
      </div>

      <DossierChargeDialog
        open={chargeOpen}
        onOpenChange={setChargeOpen}
        customerId={hub.dossier.customer.id}
        customerName={hub.dossier.customer.name}
        dossierId={hub.dossier.id}
        dossierNumber={hub.dossier.dossierNumber}
        transactionTypes={transactionTypes}
      />
    </section>
  );
}
