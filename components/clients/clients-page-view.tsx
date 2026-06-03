"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";
import type { CustomerListItemSerialized } from "@/lib/modules/customers/serialize-list";
import {
  filterAndSortClients,
  type ClientsViewState,
} from "@/lib/modules/customers/clients-query";
import { useTablePage } from "@/components/hooks/use-table-page";
import { TablePagination } from "@/components/ui/table-pagination";
import { paginateSlice } from "@/lib/ui/table-pagination";
import { ClientsTable } from "./clients-table";
import { ClientsToolbar } from "./clients-toolbar";
import { NewCustomerDialog } from "@/components/customers/new-customer-dialog";
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
  const { page, setPage } = useTablePage();

  const filteredRows = useMemo(
    () => filterAndSortClients(rows, viewState),
    [rows, viewState],
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
      <ClientsToolbar state={viewState} totalCount={filteredRows.length} />

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
          <ClientsTable rows={pagedRows} bare />
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
    </div>
  );
}
