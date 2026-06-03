import { Suspense } from "react";
import { getDb } from "@/lib/db";
import { toModuleContext } from "@/lib/auth/module-context";
import { requireAuthContext } from "@/lib/auth/session";
import { serializeCustomerListItem } from "@/lib/modules/customers/serialize-list";
import { listCustomers } from "@/lib/modules/customers/service";
import { ClientsPageView } from "@/components/clients/clients-page-view";
import { PageHeader } from "@/components/shell/page-header";
import { NewClientButton } from "@/components/shell/page-actions";

export default async function ClientsPage() {
  const auth = await requireAuthContext();
  const rows = (await listCustomers(getDb(), toModuleContext(auth))).map(
    serializeCustomerListItem,
  );

  return (
    <div className="space-y-8">
      <PageHeader
        title="Clients"
        description="Comptes clients, solde en débit/crédit et activité du jour (Dakar)."
        actions={<NewClientButton />}
      />
      <Suspense
        fallback={
          <div className="rounded-lg border bg-card px-6 py-12 text-center text-sm text-muted-foreground">
            Chargement…
          </div>
        }
      >
        <ClientsPageView rows={rows} />
      </Suspense>
    </div>
  );
}
