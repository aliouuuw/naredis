import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { declarations } from "@/lib/db/schema";
import { requireAuthContext } from "@/lib/auth/session";
import { PageHeader } from "@/components/shell/page-header";
import { NewDeclarationButton } from "@/components/shell/page-actions";

export default async function DeclarationsPage() {
  const ctx = await requireAuthContext();
  const db = getDb();

  const rows = await db
    .select({
      declarationNumber: declarations.declarationNumber,
      status: declarations.status,
    })
    .from(declarations)
    .where(eq(declarations.organizationId, ctx.organizationId))
    .limit(20);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Déclarations"
        description="Liste des déclarations douanières de votre cabinet."
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
        <ul className="divide-y rounded-lg border bg-card">
          {rows.map((row) => (
            <li
              key={row.declarationNumber}
              className="flex items-center justify-between px-4 py-3 text-sm"
            >
              <span className="font-medium">{row.declarationNumber}</span>
              <span className="text-muted-foreground">{row.status}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
