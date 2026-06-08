import { Suspense } from "react";
import { getDb } from "@/lib/db";
import { canMutateOperationalData } from "@/lib/auth/permissions";
import { toModuleContext } from "@/lib/auth/module-context";
import { requireAuthContext } from "@/lib/auth/session";
import { agencyCalendarDate } from "@/lib/domain/timezone";
import { CartesPageView } from "@/components/cartes/cartes-page-view";
import { listAgencies } from "@/lib/modules/agencies/service";
import { listGaindeCardDebitTypes } from "@/lib/modules/gainde-cards/debit-types";
import { buildCarteLedger } from "@/lib/modules/gainde-cards/service";
import { serializeCarteLedgerSnapshot } from "@/lib/modules/gainde-cards/serialize";
import { parseCarteLedgerViewState } from "@/lib/modules/gainde-cards/carte-ledger-query";
import { PageHeader } from "@/components/shell/page-header";

export default async function CartesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const auth = await requireAuthContext();
  const ctx = toModuleContext(auth);
  const db = getDb();
  const today = agencyCalendarDate();

  const agencies = await listAgencies(db, ctx, true);
  const defaultAgencyId = agencies[0]?.id ?? "";

  const viewState = parseCarteLedgerViewState(params, today, defaultAgencyId);

  const effectiveAgencyId =
    agencies.find((a) => a.id === viewState.payingAgencyId)?.id ??
    defaultAgencyId;

  const dateOpts =
    viewState.dateFrom || viewState.dateTo
      ? { dateFrom: viewState.dateFrom || undefined, dateTo: viewState.dateTo || undefined }
      : undefined;

  const [canEdit, snapshot, debitTypes] = await Promise.all([
    canMutateOperationalData(auth.userId, auth.organizationId),
    effectiveAgencyId
      ? buildCarteLedger(db, ctx, effectiveAgencyId, dateOpts)
      : Promise.resolve(null),
    listGaindeCardDebitTypes(db, ctx),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Cartes GAINDE"
        description="Solde de chaque carte : règlements, débits par zone et types, solde à jour."
      />
      <Suspense
        fallback={
          <div className="rounded-lg border bg-card px-6 py-12 text-center text-sm text-muted-foreground">
            Chargement…
          </div>
        }
      >
        <CartesPageView
          agencies={agencies.map((a) => ({ id: a.id, name: a.name }))}
          viewState={{ ...viewState, payingAgencyId: effectiveAgencyId }}
          snapshot={snapshot ? serializeCarteLedgerSnapshot(snapshot) : null}
          debitTypes={debitTypes}
          today={today}
          canEdit={canEdit}
          agenciesForFiche={agencies.map((a) => ({ id: a.id, name: a.name }))}
        />
      </Suspense>
    </div>
  );
}
