"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";
import type { CustomerListItemSerialized } from "@/lib/modules/customers/serialize-list";
import {
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
}: {
  rows: CustomerListItemSerialized[];
  viewState: ClientsViewState;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [newDialogOpen, setNewDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<CustomerListItemSerialized | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CustomerListItemSerialized | null>(null);
  const [searchDraft, setSearchDraft] = useState(viewState.search);
  const { page, setPage } = useTablePage();
  const tableColumns = useTableColumns(CLIENT_LIST_TABLE_ID, CLIENT_LIST_COLUMNS);

  // Reset local search when the URL search param changes (e.g. back-navigation)
  useEffect(() => {
    setSearchDraft(viewState.search);
  }, [viewState.search]);

  // Reset to first page when search changes
  useEffect(() => {
    setPage(1);
  }, [searchDraft, setPage]);

  const filteredRows = useMemo(
    () => filterAndSortClients(rows, { ...viewState, search: searchDraft }),
    [rows, viewState, searchDraft],
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
      <ClientsToolbar
        state={viewState}
        totalCount={filteredRows.length}
        searchDraft={searchDraft}
        onSearchDraftChange={setSearchDraft}
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
