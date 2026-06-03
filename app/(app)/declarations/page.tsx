import { Suspense } from "react";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { customers } from "@/lib/db/schema";
import { canMutateOperationalData } from "@/lib/auth/permissions";
import { toModuleContext } from "@/lib/auth/module-context";
import { requireAuthContext } from "@/lib/auth/session";
import { agencyCalendarDate } from "@/lib/domain/timezone";
import { DeclarationsView } from "@/components/declarations/declarations-view";
import {
  parseDeclarationsViewState,
  viewStateToListFilters,
} from "@/lib/modules/declarations/declarations-query";
import { serializeDeclarationListItem } from "@/lib/modules/declarations/serialize-list";
import { listDeclarations } from "@/lib/modules/declarations/service";
import { listAgencies } from "@/lib/modules/agencies/service";
import { PageHeader } from "@/components/shell/page-header";
import { ListCrossLinks } from "@/components/shell/list-cross-links";
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

  const canEdit = await canMutateOperationalData(
    auth.userId,
    auth.organizationId,
  );

  const [rows, customerRows, agencies] = await Promise.all([
    listDeclarations(db, ctx, listFilters).then((items) =>
      items.map(serializeDeclarationListItem),
    ),
    db
      .select({ id: customers.id, name: customers.name, slug: customers.slug })
      .from(customers)
      .where(eq(customers.organizationId, ctx.organizationId))
      .orderBy(customers.name),
    listAgencies(db, ctx),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Déclarations"
        description="Une ligne par connaissement (BL) — montants et BAD. Filtres et tri dans l'URL."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <ListCrossLinks
              links={[
                { href: "/dossiers", label: "Dossiers" },
                { href: "/clients", label: "Clients" },
              ]}
            />
            {canEdit ? <NewDeclarationButton /> : null}
          </div>
        }
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
          agencies={agencies.map((a) => ({ id: a.id, name: a.name }))}
          canEdit={canEdit}
        />
      </Suspense>
    </div>
  );
}
