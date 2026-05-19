import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { declarations } from "@/lib/db/schema";
import { requireAuthContext } from "@/lib/auth/session";

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
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Déclarations</h1>
        <p className="text-sm text-muted-foreground">
          Liste des déclarations douanières de votre cabinet.
        </p>
      </div>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Aucune déclaration pour cette organisation.
        </p>
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
