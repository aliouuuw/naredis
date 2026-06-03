import { Suspense } from "react";
import { getDb } from "@/lib/db";
import { toModuleContext } from "@/lib/auth/module-context";
import { requireAuthContext } from "@/lib/auth/session";
import { serializeCustomerListItem } from "@/lib/modules/customers/serialize-list";
import { listCustomers } from "@/lib/modules/customers/service";
import { ClientsPageView } from "@/components/clients/clients-page-view";
import { parseClientsViewState } from "@/lib/modules/customers/clients-query";
import { PageHeader } from "@/components/shell/page-header";
import { ListCrossLinks } from "@/components/shell/list-cross-links";
import { NewClientButton } from "@/components/shell/page-actions";

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const auth = await requireAuthContext();
  const viewState = parseClientsViewState(params);
  const rows = (await listCustomers(getDb(), toModuleContext(auth))).map(
    serializeCustomerListItem,
  );

  return (
    <div className="space-y-8">
      <PageHeader
        title="Clients"
        description="Comptes clients — soldes, frais dossiers et mouvements du jour. Filtres et tri dans l'URL."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <ListCrossLinks
              links={[
                { href: "/transactions?preset=today", label: "Transactions" },
                { href: "/declarations", label: "Déclarations" },
              ]}
            />
            <NewClientButton />
          </div>
        }
      />
      <Suspense
        fallback={
          <div className="rounded-lg border bg-card px-6 py-12 text-center text-sm text-muted-foreground">
            Chargement…
          </div>
        }
      >
        <ClientsPageView rows={rows} viewState={viewState} />
      </Suspense>
    </div>
  );
}
