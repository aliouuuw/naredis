import { getDb } from "@/lib/db";
import { toModuleContext } from "@/lib/auth/module-context";
import { requireAuthContext } from "@/lib/auth/session";
import { listDossiers } from "@/lib/modules/dossiers/service";
import { DossiersPageView } from "@/components/dossiers/dossiers-page-view";
import { PageHeader } from "@/components/shell/page-header";
import { ListCrossLinks } from "@/components/shell/list-cross-links";
import { NewDeclarationButton } from "@/components/shell/page-actions";

export default async function DossiersPage() {
  const auth = await requireAuthContext();
  const ctx = toModuleContext(auth);
  const db = getDb();
  const rows = await listDossiers(db, ctx);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dossiers"
        description="Connaissements (BL) et regroupement des déclarations — hub par dossier."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <ListCrossLinks
              links={[
                { href: "/declarations", label: "Déclarations" },
                { href: "/clients", label: "Clients" },
              ]}
            />
            <NewDeclarationButton />
          </div>
        }
      />

      <DossiersPageView rows={rows} />
    </div>
  );
}
