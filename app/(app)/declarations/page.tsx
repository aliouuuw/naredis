import { Suspense } from "react";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { customers } from "@/lib/db/schema";
import { canMutateOperationalData } from "@/lib/auth/permissions";
import { toModuleContext } from "@/lib/auth/module-context";
import { requireAuthContext } from "@/lib/auth/session";
import { DeclarationsPageView } from "@/components/declarations/declarations-page-view";
import { serializeDeclarationListItem } from "@/lib/modules/declarations/serialize-list";
import { listDeclarations } from "@/lib/modules/declarations/service";
import { listAgencies } from "@/lib/modules/agencies/service";
import { PageHeader } from "@/components/shell/page-header";
import { NewDeclarationButton } from "@/components/shell/page-actions";

export default async function DeclarationsPage() {
  const auth = await requireAuthContext();
  const ctx = toModuleContext(auth);
  const db = getDb();

  const canEdit = await canMutateOperationalData(
    auth.userId,
    auth.organizationId,
  );

  const [rows, customerRows, agencies] = await Promise.all([
    listDeclarations(db, ctx).then((items) =>
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
        description="Une ligne par connaissement (BL) — cliquez une ligne pour ouvrir la fiche."
        actions={canEdit ? <NewDeclarationButton /> : undefined}
      />
      <Suspense
        fallback={
          <div className="rounded-lg border bg-card px-6 py-12 text-center text-sm text-muted-foreground">
            Chargement des déclarations…
          </div>
        }
      >
        <DeclarationsPageView
          rows={rows}
          customers={customerRows}
          agencies={agencies.map((a) => ({ id: a.id, name: a.name }))}
          canEdit={canEdit}
        />
      </Suspense>
    </div>
  );
}
