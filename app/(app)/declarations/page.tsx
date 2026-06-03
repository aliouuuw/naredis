import { Suspense } from "react";
import { getDb } from "@/lib/db";
import { canMutateOperationalData } from "@/lib/auth/permissions";
import { toModuleContext } from "@/lib/auth/module-context";
import { requireAuthContext } from "@/lib/auth/session";
import { DeclarationsListView } from "@/components/declarations/declarations-list-view";
import { serializeDeclarationListItem } from "@/lib/modules/declarations/serialize-list";
import { listDeclarations } from "@/lib/modules/declarations/service";
import { PageHeader } from "@/components/shell/page-header";
import { NewDeclarationButton } from "@/components/shell/page-actions";

function DeclarationsListFallback() {
  return (
    <div className="rounded-lg border bg-card px-6 py-12 text-center text-sm text-muted-foreground">
      Chargement des déclarations…
    </div>
  );
}

async function DeclarationsListContent() {
  const auth = await requireAuthContext();
  const ctx = toModuleContext(auth);
  const [rows, canEdit] = await Promise.all([
    listDeclarations(getDb(), ctx).then((items) =>
      items.map(serializeDeclarationListItem),
    ),
    canMutateOperationalData(auth.userId, auth.organizationId),
  ]);

  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-dashed bg-muted/30 px-6 py-10 text-center">
        <p className="text-sm text-muted-foreground">
          Créez votre première déclaration pour commencer.
        </p>
        <div className="mt-4 flex justify-center">
          <NewDeclarationButton />
        </div>
      </div>
    );
  }

  return <DeclarationsListView rows={rows} canEdit={canEdit} />;
}

export default function DeclarationsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Déclarations"
        description="Une ligne par connaissement (BL) — cliquez une ligne pour ouvrir la fiche."
        actions={<NewDeclarationButton />}
      />
      <Suspense fallback={<DeclarationsListFallback />}>
        <DeclarationsListContent />
      </Suspense>
    </div>
  );
}
