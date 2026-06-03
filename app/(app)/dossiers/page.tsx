import Link from "next/link";
import { getDb } from "@/lib/db";
import { toModuleContext } from "@/lib/auth/module-context";
import { requireAuthContext } from "@/lib/auth/session";
import { listDossiers } from "@/lib/modules/dossiers/service";
import { DossiersTable } from "@/components/dossiers/dossiers-table";
import { PageHeader } from "@/components/shell/page-header";
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
        actions={<NewDeclarationButton />}
      />

      <DossiersTable rows={rows} />

      <p className="text-sm text-muted-foreground">
        <Link href="/declarations" className="hover:underline">
          ← Déclarations
        </Link>
      </p>
    </div>
  );
}
