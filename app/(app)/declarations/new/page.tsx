import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { customers } from "@/lib/db/schema";
import { toModuleContext } from "@/lib/auth/module-context";
import { requireAuthContext } from "@/lib/auth/session";
import { listAgencies } from "@/lib/modules/agencies/service";
import { PageHeader } from "@/components/shell/page-header";
import { NewDeclarationForm } from "@/components/declarations/new-declaration-form";

export default async function NewDeclarationPage() {
  const auth = await requireAuthContext();
  const ctx = toModuleContext(auth);
  const db = getDb();

  const [customerRows, agencies] = await Promise.all([
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
        title="Nouvelle déclaration"
        description="Une ligne par connaissement (BL) — crée un dossier et la déclaration associée."
      />
      <NewDeclarationForm
        customers={customerRows}
        agencies={agencies.map((a) => ({ id: a.id, name: a.name }))}
      />
    </div>
  );
}
