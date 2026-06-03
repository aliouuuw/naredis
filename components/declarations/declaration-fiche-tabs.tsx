"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, FolderOpen } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { formatXof } from "@/lib/domain/balance";
import type {
  ActivityLogEntrySerialized,
  DeclarationEditLogEntrySerialized,
} from "@/lib/modules/declarations/serialize-fiche";
import { DeclarationActivityFeed } from "./declaration-activity-feed";
import { DeclarationEditTimeline } from "./declaration-edit-timeline";
import {
  EditDeclarationForm,
  type EditDeclarationInitial,
} from "./edit-declaration-form";
import { DeclarationReadOnlySummary } from "./declaration-read-only-summary";
import type { AgencyOption } from "./new-declaration-form";

type TabId = "resume" | "historique" | "activite";

function formatMoney(value: bigint | null) {
  if (value == null) return "—";
  return `${formatXof(value)} XOF`;
}

export function DeclarationFicheTabs({
  variant = "page",
  declarationNumber,
  bonADelivrer,
  dossier,
  customer,
  payingAgencyName,
  amounts,
  editInitial,
  agencies,
  editLog,
  activityLog,
  agencyNameById,
  canEdit,
  formKey,
  onSaved,
}: {
  variant?: "page" | "sheet";
  declarationNumber: string;
  bonADelivrer: boolean;
  dossier: { id: string; dossierNumber: string; blReference: string | null };
  customer: { id: string; name: string; slug: string };
  payingAgencyName: string | null;
  amounts: {
    clientAmountPaid: bigint | null;
    gaindeDutyAmount: bigint | null;
    costPrice: bigint | null;
  };
  editInitial: EditDeclarationInitial;
  agencies: AgencyOption[];
  editLog: DeclarationEditLogEntrySerialized[];
  activityLog: ActivityLogEntrySerialized[];
  agencyNameById: Record<string, string>;
  canEdit: boolean;
  formKey: string;
  onSaved?: () => void;
}) {
  const isSheet = variant === "sheet";
  const [tab, setTab] = useState<TabId>("resume");

  const tabs: { id: TabId; label: string; count?: number }[] = [
    { id: "resume", label: "Résumé" },
    { id: "historique", label: "Historique", count: editLog.length },
    { id: "activite", label: "Activité", count: activityLog.length },
  ];

  return (
    <div className="space-y-6">
      <aside className="rounded-lg border bg-card p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Dossier
        </p>
        <p className="mt-1 font-semibold">
          <Link href={`/dossiers/${dossier.id}`} className="hover:underline">
            {dossier.dossierNumber}
          </Link>
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          BL {dossier.blReference ?? "—"} ·{" "}
          <Link href={`/clients/${customer.id}`} className="hover:underline">
            {customer.name}
          </Link>
        </p>
        <p className="mt-2 flex items-center gap-2 text-sm">
          {bonADelivrer ? (
            <>
              <Check className="size-4 text-emerald-600" />
              Bon à délivrer
            </>
          ) : (
            <span className="text-muted-foreground">Bon à délivrer : non</span>
          )}
        </p>
        <ButtonLink
          href={`/dossiers/${dossier.id}`}
          variant="outline"
          size="sm"
          className="mt-3 gap-1"
        >
          <FolderOpen className="size-3.5" aria-hidden />
          Ouvrir le dossier
        </ButtonLink>
      </aside>

      <div
        role="tablist"
        aria-label="Sections de la fiche"
        className="flex gap-1 border-b"
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

      {tab === "resume" ? (
        <div
          className={
            isSheet ? "space-y-6" : "grid gap-8 lg:grid-cols-[1fr_minmax(16rem,20rem)]"
          }
        >
          {isSheet ? (
            <section className="rounded-lg border bg-muted/20 p-4 space-y-2 text-sm">
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground">Montant client</span>
                <span className="tabular-nums font-medium">
                  {formatMoney(amounts.clientAmountPaid)}
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground">GAINDE</span>
                <span className="tabular-nums font-medium">
                  {formatMoney(amounts.gaindeDutyAmount)}
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground">Prix de revient</span>
                <span className="tabular-nums font-medium">
                  {formatMoney(amounts.costPrice)}
                </span>
              </div>
            </section>
          ) : null}

          <div className="min-w-0 space-y-4">
            {!canEdit ? (
              <>
                <p className="text-sm text-muted-foreground">
                  Lecture seule — seuls les profils opérateur, admin ou propriétaire
                  peuvent modifier une déclaration.
                </p>
                <DeclarationReadOnlySummary
                  initial={editInitial}
                  payingAgencyName={payingAgencyName}
                />
              </>
            ) : null}
            <EditDeclarationForm
              formKey={formKey}
              initial={editInitial}
              agencies={agencies}
              canEdit={canEdit}
              onSaved={onSaved}
              compactFooter={isSheet}
            />
          </div>

          {!isSheet ? (
            <section className="rounded-lg border bg-muted/20 p-4 space-y-3 h-fit">
              <h2 className="text-sm font-semibold">Aperçu · {declarationNumber}</h2>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">Montant client</dt>
                  <dd className="tabular-nums">
                    {formatMoney(amounts.clientAmountPaid)}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">GAINDE</dt>
                  <dd className="tabular-nums">
                    {formatMoney(amounts.gaindeDutyAmount)}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">Prix de revient</dt>
                  <dd className="tabular-nums">{formatMoney(amounts.costPrice)}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">Maison-mère</dt>
                  <dd>{payingAgencyName ?? "—"}</dd>
                </div>
              </dl>
            </section>
          ) : null}
        </div>
      ) : tab === "historique" ? (
        <section className="max-w-2xl">
          <h2 className="mb-1 text-sm font-semibold">Modifications (rectificative)</h2>
          <p className="mb-4 text-xs text-muted-foreground">
            Journal détaillé des champs modifiés sur cette fiche.
          </p>
          <DeclarationEditTimeline
            key={formKey}
            entries={editLog}
            agencyNameById={agencyNameById}
          />
        </section>
      ) : (
        <section className="max-w-2xl">
          <h2 className="mb-1 text-sm font-semibold">Activité</h2>
          <p className="mb-4 text-xs text-muted-foreground">
            Événements système : déclaration, dossier parent et écritures liées.
          </p>
          <DeclarationActivityFeed entries={activityLog} />
        </section>
      )}
    </div>
  );
}
