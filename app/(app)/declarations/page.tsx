import { getDb } from "@/lib/db";
import { toModuleContext } from "@/lib/auth/module-context";
import { requireAuthContext } from "@/lib/auth/session";
import { listDeclarations } from "@/lib/modules/declarations/service";
import { PageHeader } from "@/components/shell/page-header";
import { NewDeclarationButton } from "@/components/shell/page-actions";
import { DeclarationsTable } from "@/components/declarations/declarations-table";

export default async function DeclarationsPage() {
  const auth = await requireAuthContext();
  const rows = await listDeclarations(getDb(), toModuleContext(auth));

  return (
    <div className="space-y-8">
      <PageHeader
        title="Déclarations"
        description="Une ligne par connaissement (BL) — zone, conteneurs, montants et bon à délivrer."
        actions={<NewDeclarationButton />}
      />
      {rows.length === 0 ? (
        <div className="rounded-lg border border-dashed bg-muted/30 px-6 py-10 text-center">
          <p className="text-sm text-muted-foreground">
            Créez votre première déclaration pour commencer.
          </p>
          <div className="mt-4 flex justify-center">
            <NewDeclarationButton />
          </div>
        </div>
      ) : (
        <DeclarationsTable rows={rows} />
      )}
    </div>
  );
}
