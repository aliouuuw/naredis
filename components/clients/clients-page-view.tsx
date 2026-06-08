"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ClientsSavedViewsBar } from "@/components/clients/clients-saved-views-bar";
import type { OrganizationListViewSerialized } from "@/lib/modules/list-views/serialize";
import { Plus } from "lucide-react";
import type { CustomerListItemSerialized } from "@/lib/modules/customers/serialize-list";
import {
  buildClientGroupTree,
  filterAndSortClients,
  type ClientsViewState,
} from "@/lib/modules/customers/clients-query";
import { useTableColumns } from "@/components/hooks/use-table-columns";
import { useTablePage } from "@/components/hooks/use-table-page";
import { TableColumnSettings } from "@/components/ui/table-column-settings";
import { TablePagination } from "@/components/ui/table-pagination";
import {
  CLIENT_LIST_COLUMNS,
  CLIENT_LIST_TABLE_ID,
  type ClientListColumnId,
} from "@/lib/ui/list-table-columns";
import { paginateSlice } from "@/lib/ui/table-pagination";
import { ClientsTable } from "./clients-table";
import { ClientsToolbar } from "./clients-toolbar";
import { NewCustomerDialog } from "@/components/customers/new-customer-dialog";
import { EditCustomerDialog } from "@/components/customers/edit-customer-dialog";
import { DeleteCustomerDialog } from "@/components/customers/delete-customer-dialog";
import { Button } from "@/components/ui/button";

export function ClientsPageView({
  rows,
  viewState,
  orgViews,
  canManage,
}: {
  rows: CustomerListItemSerialized[];
  viewState: ClientsViewState;
  orgViews: OrganizationListViewSerialized[];
  canManage: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const applyQuery = useCallback(
    (query: string) => {
      router.replace(query ? `/clients?${query}` : "/clients", { scroll: false });
    },
    [router],
  );
  const [newDialogOpen, setNewDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<CustomerListItemSerialized | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CustomerListItemSerialized | null>(null);
  const { page, setPage } = useTablePage();
  const tableColumns = useTableColumns(CLIENT_LIST_TABLE_ID, CLIENT_LIST_COLUMNS);

  const filteredRows = useMemo(
    () => filterAndSortClients(rows, viewState),
    [rows, viewState],
  );

  const groupTree = useMemo(
    () =>
      viewState.groupBy.length > 0
        ? buildClientGroupTree(filteredRows, viewState.groupBy)
        : null,
    [filteredRows, viewState.groupBy],
  );

  const { items: pagedRows, page: safePage } = useMemo(
    () => paginateSlice(filteredRows, page),
    [filteredRows, page],
  );

  useEffect(() => {
    if (searchParams.get("new") !== "1") return;
    setNewDialogOpen(true);
    const sp = new URLSearchParams(searchParams.toString());
    sp.delete("new");
    const qs = sp.toString();
    router.replace(qs ? `/clients?${qs}` : "/clients", { scroll: false });
  }, [searchParams, router]);

  return (
    <div className="space-y-6">
      <ClientsSavedViewsBar
        orgViews={orgViews}
        canManage={canManage}
        viewState={viewState}
        onApplyQuery={applyQuery}
      />

      <ClientsToolbar
        state={viewState}
        totalCount={filteredRows.length}
        columnSettings={
          tableColumns.ready ? (
            <TableColumnSettings
              columns={CLIENT_LIST_COLUMNS}
              prefs={tableColumns.prefs}
              onPrefsChange={tableColumns.updatePrefs}
              onReset={tableColumns.resetPrefs}
            />
          ) : null
        }
      />

      {filteredRows.length === 0 ? (
        <div className="rounded-lg border border-dashed bg-muted/30 px-6 py-10 text-center">
          <p className="text-sm text-muted-foreground">
            {rows.length === 0
              ? "Aucun client pour le moment."
              : "Aucun client ne correspond à ces filtres."}
          </p>
          {rows.length === 0 ? (
            <div className="mt-4 flex justify-center">
              <Button
                type="button"
                className="rounded-full"
                onClick={() => setNewDialogOpen(true)}
              >
                <Plus className="size-4" />
                Nouveau client
              </Button>
            </div>
          ) : null}
        </div>
      ) : groupTree ? (
        <ul className="space-y-2">
          {groupTree.map((node) => (
            <li key={node.key} className="rounded-lg border bg-card px-4 py-3">
              <p className="text-sm font-medium">
                {node.label}{" "}
                <span className="text-muted-foreground">({node.count})</span>
              </p>
              {node.children ? (
                <ul className="mt-2 space-y-1 border-l pl-3 text-xs text-muted-foreground">
                  {node.children.map((child) => (
                    <li key={child.key}>
                      {child.label} — {child.count} client
                      {child.count === 1 ? "" : "s"}
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <div className="overflow-hidden rounded-lg border bg-card">
          <ClientsTable
            rows={pagedRows}
            bare
            visibleColumnIds={tableColumns.visibleIds as ClientListColumnId[]}
            onEdit={setEditTarget}
            onDelete={setDeleteTarget}
          />
          <TablePagination
            totalItems={filteredRows.length}
            page={safePage}
            onPageChange={setPage}
            itemLabel="client"
          />
        </div>
      )}

      <NewCustomerDialog
        open={newDialogOpen}
        onOpenChange={setNewDialogOpen}
        onCreated={(customerId) => {
          router.push(`/clients/${customerId}`);
          router.refresh();
        }}
      />

      {editTarget ? (
        <EditCustomerDialog
          customer={editTarget}
          open={editTarget !== null}
          onOpenChange={(open) => { if (!open) setEditTarget(null); }}
          onUpdated={() => router.refresh()}
        />
      ) : null}

      {deleteTarget ? (
        <DeleteCustomerDialog
          customer={deleteTarget}
          open={deleteTarget !== null}
          onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
          onDeleted={() => router.refresh()}
        />
      ) : null}
    </div>
  );
}
