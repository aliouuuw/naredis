import { eq } from "drizzle-orm";
import { Suspense } from "react";
import { getDb } from "@/lib/db";
import { customers } from "@/lib/db/schema";
import { canMutateOperationalData } from "@/lib/auth/permissions";
import { toModuleContext } from "@/lib/auth/module-context";
import { requireAuthContext } from "@/lib/auth/session";
import { agencyCalendarDate } from "@/lib/domain/timezone";
import { DeclarationsView } from "@/components/declarations/declarations-view";
import { OrgFormSuggestionsProvider } from "@/components/providers/org-form-suggestions-provider";
import {
  parseDeclarationsViewState,
  viewStateToListFilters,
} from "@/lib/modules/declarations/declarations-query";
import { serializeDeclarationListItem } from "@/lib/modules/declarations/serialize-list";
import { listDeclarations } from "@/lib/modules/declarations/service";
import { listAgencies } from "@/lib/modules/agencies/service";
import { getOrgFormSuggestions } from "@/lib/modules/form-suggestions/service";
import { PageHeader } from "@/components/shell/page-header";
import { NewDeclarationButton } from "@/components/shell/page-actions";

export default async function DeclarationsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const auth = await requireAuthContext();
  const ctx = toModuleContext(auth);
  const db = getDb();
  const today = agencyCalendarDate();

  const viewState = parseDeclarationsViewState(params, today);
  const listFilters = viewStateToListFilters(viewState);

  const [canEdit, rows, customerRows, agencies, formSuggestions] =
    await Promise.all([
      canMutateOperationalData(auth.userId, auth.organizationId),
      listDeclarations(db, ctx, listFilters).then((items) =>
        items.map(serializeDeclarationListItem),
      ),
      db
        .select({ id: customers.id, name: customers.name, slug: customers.slug })
        .from(customers)
        .where(eq(customers.organizationId, ctx.organizationId))
        .orderBy(customers.name),
      listAgencies(db, ctx),
      getOrgFormSuggestions(db, ctx),
    ]);

  const agencyOptions = agencies.map((a) => ({ id: a.id, name: a.name }));

  return (
    <OrgFormSuggestionsProvider suggestions={formSuggestions}>
      <div className="space-y-8">
        <PageHeader
          title="Déclarations"
          description="Une ligne par connaissement (BL) — montants et BAD. Filtres et tri dans l'URL."
          actions={canEdit ? <NewDeclarationButton /> : undefined}
        />
        <Suspense
          fallback={
            <div className="rounded-lg border bg-card px-6 py-12 text-center text-sm text-muted-foreground">
              Chargement des déclarations…
            </div>
          }
        >
          <DeclarationsView
            rows={rows}
            viewState={viewState}
            customers={customerRows}
            agencies={agencyOptions}
            canEdit={canEdit}
          />
        </Suspense>
      </div>
    </OrgFormSuggestionsProvider>
  );
}
