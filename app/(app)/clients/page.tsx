import { getDb } from "@/lib/db";
import { toModuleContext } from "@/lib/auth/module-context";
import { requireAuthContext } from "@/lib/auth/session";
import { listCustomers } from "@/lib/modules/customers/service";
import { PageHeader } from "@/components/shell/page-header";
import { NewClientButton } from "@/components/shell/page-actions";
import { ClientsTable } from "@/components/clients/clients-table";

export default async function ClientsPage() {
  const auth = await requireAuthContext();
  const rows = await listCustomers(getDb(), toModuleContext(auth));

  return (
    <div className="space-y-8">
      <PageHeader
        title="Clients"
        description="Comptes clients, solde en débit/crédit et activité du jour (Dakar)."
        actions={<NewClientButton />}
      />
      {rows.length === 0 ? (
        <div className="rounded-lg border border-dashed bg-muted/30 px-6 py-10 text-center">
          <p className="text-sm text-muted-foreground">
            Aucun client pour le moment.
          </p>
          <div className="mt-4 flex justify-center">
            <NewClientButton />
          </div>
        </div>
      ) : (
        <ClientsTable rows={rows} />
      )}
    </div>
  );
}
