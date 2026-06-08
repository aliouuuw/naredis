"use client";

import { useCallback, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, Minus, Plus } from "lucide-react";
import { RecordCardPaymentDialog } from "@/components/cartes/record-card-payment-dialog";
import { RecordCardDebitDialog } from "@/components/cartes/record-card-debit-dialog";
import { CarteZoneLedgerTable } from "@/components/cartes/carte-zone-ledger-table";
import { CarteDebitTypeTable } from "@/components/cartes/carte-debit-type-table";
import { PeriodDateRange } from "@/components/transactions/period-date-range";
import { DeclarationFicheSheet } from "@/components/declarations/declaration-fiche-sheet";
import {
  type CarteDatePreset,
  type CarteLedgerViewState,
  serializeCarteLedgerSearchParams,
} from "@/lib/modules/gainde-cards/carte-ledger-query";
import type { CarteLedgerSnapshotSerialized } from "@/lib/modules/gainde-cards/serialize";
import type { GaindeCardDebitTypeRow } from "@/lib/modules/gainde-cards/debit-types";
import { agencyDateRangeForPreset } from "@/lib/modules/ledger/transactions-query";
import { formatXof } from "@/lib/domain/balance";
import { Button } from "@/components/ui/button";
import { FormSelect } from "@/components/ui/form-select";
import { cn } from "@/lib/utils";

type AgencyTab = { id: string; name: string };

const DATE_PRESETS: { id: CarteDatePreset; label: string }[] = [
  { id: "today", label: "Aujourd'hui" },
  { id: "yesterday", label: "Hier" },
  { id: "week", label: "Cette semaine" },
  { id: "month", label: "Ce mois" },
  { id: "last30", label: "30 jours" },
  { id: "all", label: "Tout" },
];

export function CartesPageView({
  agencies,
  viewState,
  snapshot,
  debitTypes,
  today,
  canEdit,
  agenciesForFiche,
}: {
  agencies: AgencyTab[];
  viewState: CarteLedgerViewState;
  snapshot: CarteLedgerSnapshotSerialized | null;
  debitTypes: GaindeCardDebitTypeRow[];
  today: string;
  canEdit: boolean;
  agenciesForFiche: Array<{ id: string; name: string }>;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [debitDialogOpen, setDebitDialogOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedDeclarationId, setSelectedDeclarationId] = useState<
    string | null
  >(null);

  const pushState = useCallback(
    (next: CarteLedgerViewState) => {
      const qs = serializeCarteLedgerSearchParams(next).toString();
      startTransition(() => {
        router.replace(qs ? `/cartes?${qs}` : "/cartes", { scroll: false });
      });
    },
    [router],
  );

  const totalPayments = snapshot
    ? BigInt(snapshot.totalPayments)
    : BigInt(0);
  const totalDebits = snapshot ? BigInt(snapshot.totalDebits) : BigInt(0);
  const balance = snapshot ? BigInt(snapshot.balanceRemaining) : BigInt(0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-1 border-b pb-2">
        {agencies.map((agency) => (
          <button
            key={agency.id}
            type="button"
            disabled={pending}
            onClick={() =>
              pushState({ ...viewState, payingAgencyId: agency.id })
            }
            className={cn(
              "inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors disabled:opacity-50",
              viewState.payingAgencyId === agency.id
                ? "border-primary bg-primary/10 text-foreground"
                : "border-transparent text-muted-foreground hover:bg-muted/50",
            )}
          >
            <CreditCard className="size-3.5 opacity-70" />
            <span className="max-w-[10rem] truncate">{agency.name}</span>
          </button>
        ))}
      </div>

      {snapshot ? (
        <>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <FormSelect
                size="sm"
                value={viewState.datePreset}
                onValueChange={(v) => {
                  if (!v) return;
                  const preset = v as CarteDatePreset;
                  const range = agencyDateRangeForPreset(preset, today);
                  pushState({
                    ...viewState,
                    datePreset: preset,
                    dateFrom: range.dateFrom,
                    dateTo: range.dateTo,
                  });
                }}
                options={DATE_PRESETS.map((p) => ({
                  value: p.id,
                  label: p.label,
                }))}
                triggerClassName="w-[180px]"
              />
              {viewState.datePreset === "all" ? (
                <PeriodDateRange
                  dateFrom={viewState.dateFrom}
                  dateTo={viewState.dateTo}
                  onChange={(dateFrom, dateTo) =>
                    pushState({ ...viewState, dateFrom, dateTo })
                  }
                />
              ) : null}
            </div>
            {canEdit ? (
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="gap-1"
                  onClick={() => setDebitDialogOpen(true)}
                  disabled={debitTypes.length === 0}
                >
                  <Minus className="size-4" />
                  Débit carte
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="gap-1"
                  onClick={() => setPaymentDialogOpen(true)}
                >
                  <Plus className="size-4" />
                  Règlement de carte
                </Button>
              </div>
            ) : null}
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <SummaryCard
              label="Règlements (période)"
              value={`${formatXof(totalPayments)} XOF`}
              hint={
                snapshot.loads.length > 0
                  ? `${snapshot.loads.length} règlement${snapshot.loads.length > 1 ? "s" : ""}`
                  : "Crédits enregistrés sur la carte"
              }
            />
            <SummaryCard
              label="Débits (période)"
              value={`${formatXof(totalDebits)} XOF`}
              hint="Droits de douane (déclarations) + autres débits"
            />
            <SummaryCard
              label="Solde carte à jour"
              value={`${formatXof(balance)} XOF`}
              hint="Tous règlements − tous débits (à la date de fin)"
              emphasis={balance < BigInt(0) ? "destructive" : "default"}
            />
          </div>

          {snapshot.loads.length > 0 ? (
            <details className="rounded-lg border bg-card px-4 py-3 text-sm">
              <summary className="cursor-pointer font-medium text-muted-foreground">
                Règlements de carte ({snapshot.loads.length})
              </summary>
              <ul className="mt-3 space-y-2">
                {snapshot.loads.map((load) => (
                  <li
                    key={load.id}
                    className="flex flex-wrap justify-between gap-2 border-b border-dashed pb-2 last:border-0 last:pb-0"
                  >
                    <span>
                      {formatDate(load.effectiveDate)}
                      {load.label ? ` — ${load.label}` : ""}
                    </span>
                    <span className="tabular-nums font-medium">
                      {formatXof(BigInt(load.amount))} XOF
                    </span>
                  </li>
                ))}
              </ul>
            </details>
          ) : null}

          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">
              Droits de douane par zone (déclarations)
            </h3>
            <CarteZoneLedgerTable
              snapshot={snapshot}
              onOpenDeclaration={(id) => {
                setSelectedDeclarationId(id);
                setSheetOpen(true);
              }}
            />
          </div>

          <CarteDebitTypeTable snapshot={snapshot} />
        </>
      ) : (
        <p className="text-sm text-muted-foreground">
          Aucune carte configurée. Ajoutez une maison-mère dans Réglages.
        </p>
      )}

      {snapshot && canEdit ? (
        <>
          <RecordCardPaymentDialog
            open={paymentDialogOpen}
            onOpenChange={setPaymentDialogOpen}
            payingAgencyId={snapshot.agencyId}
            agencyName={snapshot.agencyName}
          />
          <RecordCardDebitDialog
            open={debitDialogOpen}
            onOpenChange={setDebitDialogOpen}
            payingAgencyId={snapshot.agencyId}
            agencyName={snapshot.agencyName}
            debitTypes={debitTypes}
          />
        </>
      ) : null}

      <DeclarationFicheSheet
        declarationId={selectedDeclarationId}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        canEdit={canEdit}
        agencies={agenciesForFiche}
      />
    </div>
  );
}

function SummaryCard({
  label,
  value,
  hint,
  emphasis = "default",
}: {
  label: string;
  value: string;
  hint: string;
  emphasis?: "default" | "destructive";
}) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-1 text-xl font-semibold tabular-nums",
          emphasis === "destructive" && "text-destructive",
        )}
      >
        {value}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR").format(new Date(value));
}
