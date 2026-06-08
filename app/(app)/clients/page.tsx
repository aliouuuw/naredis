import { Suspense } from "react";
import { getDb } from "@/lib/db";
import { toModuleContext } from "@/lib/auth/module-context";
import { requireAuthContext } from "@/lib/auth/session";
import { serializeCustomerListItem } from "@/lib/modules/customers/serialize-list";
import { listCustomers } from "@/lib/modules/customers/service";
import { ClientsPageView } from "@/components/clients/clients-page-view";
import { parseClientsViewState } from "@/lib/modules/customers/clients-query";
import { listOrganizationListViews } from "@/lib/modules/list-views/service";
import { serializeOrganizationListView } from "@/lib/modules/list-views/serialize";
import { canMutateOperationalData } from "@/lib/auth/permissions";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shell/page-header";
import { NewClientButton } from "@/components/shell/page-actions";

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const auth = await requireAuthContext();
  const ctx = toModuleContext(auth);
  const db = getDb();

  const orgViews = (
    await listOrganizationListViews(db, ctx, "clients")
  ).map(serializeOrganizationListView);

  const tabRaw = Array.isArray(params.tab) ? params.tab[0] : params.tab;
  if (tabRaw?.startsWith("saved:")) {
    const id = tabRaw.slice("saved:".length);
    const saved = orgViews.find((v) => v.id === id);
    const hasFilters =
      Object.keys(params).some(
        (k) => k !== "tab" && k !== "page",
      ) || (Array.isArray(params.f) ? params.f.length > 0 : Boolean(params.f));
    if (saved && !hasFilters) {
      redirect(`/clients?${saved.query}`);
    }
  }

  const viewState = parseClientsViewState(params);
  const [canManage, rows] = await Promise.all([
    canMutateOperationalData(auth.userId, auth.organizationId),
    listCustomers(db, ctx).then((items) =>
      items.map(serializeCustomerListItem),
    ),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Clients"
        description="Comptes clients — filtres combinables, regroupements et tri synchronisés dans l'URL."
        actions={<NewClientButton />}
      />
      <Suspense
        fallback={
          <div className="rounded-lg border bg-card px-6 py-12 text-center text-sm text-muted-foreground">
            Chargement…
          </div>
        }
      >
        <ClientsPageView
          rows={rows}
          viewState={viewState}
          orgViews={orgViews}
          canManage={canManage}
        />
      </Suspense>
    </div>
  );
}
