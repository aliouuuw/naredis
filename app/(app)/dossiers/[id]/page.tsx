import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { declarations } from "@/lib/db/schema";
import { toModuleContext } from "@/lib/auth/module-context";
import { requireAuthContext } from "@/lib/auth/session";
import { getDossierById } from "@/lib/modules/dossiers/service";
import { PageHeader } from "@/components/shell/page-header";

export default async function DossierFichePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const auth = await requireAuthContext();
  const ctx = toModuleContext(auth);
  const db = getDb();

  const dossier = await getDossierById(db, ctx, id);
  if (!dossier) {
    notFound();
  }

  const filingRows = await db
    .select({
      id: declarations.id,
      declarationNumber: declarations.declarationNumber,
      bonADelivrer: declarations.bonADelivrer,
    })
    .from(declarations)
    .where(eq(declarations.dossierId, id));

  return (
    <div className="space-y-8">
      <PageHeader
        title={dossier.dossierNumber}
        description={`BL ${dossier.blReference ?? "—"} · ${dossier.caseStatus}`}
      />

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Déclarations sur ce dossier</h2>
        <ul className="divide-y rounded-lg border bg-card">
          {filingRows.map((row) => (
            <li key={row.id} className="px-4 py-3 text-sm">
              <Link
                href={`/declarations/${row.id}`}
                className="font-medium hover:underline"
              >
                {row.declarationNumber}
              </Link>
              {row.bonADelivrer ? (
                <span className="ml-2 text-xs text-emerald-600">BAD</span>
              ) : null}
            </li>
          ))}
        </ul>
      </section>

      <p className="text-sm text-muted-foreground">
        <Link href="/declarations" className="hover:underline">
          ← Déclarations
        </Link>
      </p>
    </div>
  );
}
