"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTableColumns } from "@/components/hooks/use-table-columns";
import { useTablePage } from "@/components/hooks/use-table-page";
import { TableColumnSettings } from "@/components/ui/table-column-settings";
import { DownloadExcelButton } from "@/components/ui/download-excel-button";
import { TablePagination } from "@/components/ui/table-pagination";
import { listExportUrl } from "@/lib/ui/list-export-query";
import {
  DECLARATION_LIST_COLUMNS,
  DECLARATION_LIST_TABLE_ID,
  type DeclarationListColumnId,
} from "@/lib/ui/list-table-columns";
import { paginateSlice } from "@/lib/ui/table-pagination";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";
import type {
  AgencyOption,
  CustomerOption,
} from "@/components/declarations/new-declaration-form";
import { NewCustomerDialog } from "@/components/customers/new-customer-dialog";
import { DeclarationFicheSheet } from "@/components/declarations/declaration-fiche-sheet";
import { DeclarationsTable } from "@/components/declarations/declarations-table";
import { DeclarationsToolbar } from "@/components/declarations/declarations-toolbar";
import { NewDeclarationDialog } from "@/components/declarations/new-declaration-dialog";
import { DeclarationSavedViewsBar } from "@/components/declarations/declaration-saved-views-bar";
import type { OrganizationListViewSerialized } from "@/lib/modules/list-views/serialize";
import { GroupedDeclarationsList } from "@/components/declarations/grouped-declarations-list";
import {
  applyDeclarationClientFilters,
  buildDeclarationGroupTree,
  sortDeclarationRows,
  sumDeclarationLedgerTotals,
  type DeclarationsViewState,
} from "@/lib/modules/declarations/declarations-query";
import type { DeclarationListItemSerialized } from "@/lib/modules/declarations/serialize-list";
import { Button } from "@/components/ui/button";

export function DeclarationsView({
  rows,
  viewState,
  customers,
  agencies,
  canEdit,
  orgViews,
  zoneSlugs,
  today,
}: {
  rows: DeclarationListItemSerialized[];
  viewState: DeclarationsViewState;
  customers: CustomerOption[];
  agencies: AgencyOption[];
  canEdit: boolean;
  orgViews: OrganizationListViewSerialized[];
  zoneSlugs: string[];
  today: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [newDialogOpen, setNewDialogOpen] = useState(false);
  const [newClientDialogOpen, setNewClientDialogOpen] = useState(false);
  const [presetCustomerId, setPresetCustomerId] = useState<string | undefined>();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { page, setPage } = useTablePage();
  const tableColumns = useTableColumns(
    DECLARATION_LIST_TABLE_ID,
    DECLARATION_LIST_COLUMNS,
  );

  const applyQuery = useCallback(
    (query: string) => {
      router.replace(
        query ? `/declarations?${query}` : "/declarations",
        { scroll: false },
      );
    },
    [router],
  );

  const filteredRows = useMemo(
    () => applyDeclarationClientFilters(rows, viewState.rules),
    [rows, viewState.rules],
  );

  const sortedRows = useMemo(
    () => sortDeclarationRows(filteredRows, viewState.sort),
    [filteredRows, viewState.sort],
  );

  const ledgerTotals = useMemo(
    () =>
      viewState.showLedgerTotals
        ? sumDeclarationLedgerTotals(sortedRows)
        : null,
    [sortedRows, viewState.showLedgerTotals],
  );

  const groupTree = useMemo(
    () =>
      viewState.groupBy.length > 0
        ? buildDeclarationGroupTree(sortedRows, viewState.groupBy)
        : null,
    [sortedRows, viewState.groupBy],
  );

  const { items: pagedRows, page: safePage } = useMemo(
    () => paginateSlice(sortedRows, page),
    [sortedRows, page],
  );

  const declarationsExportUrl = useMemo(
    () => listExportUrl("/api/declarations/export", searchParams),
    [searchParams],
  );

  const openDeclaration = useCallback(
    (id: string, { syncUrl = true }: { syncUrl?: boolean } = {}) => {
      setSelectedId(id);
      setSheetOpen(true);
      if (syncUrl && searchParams.get("open") !== id) {
        const sp = new URLSearchParams(searchParams.toString());
        sp.set("open", id);
        router.push(`/declarations?${sp.toString()}`, { scroll: false });
      }
    },
    [router, searchParams],
  );

  useEffect(() => {
    if (searchParams.get("new") !== "1") return;
    const customer = searchParams.get("customer") ?? undefined;
    setPresetCustomerId(customer);
    setNewDialogOpen(true);
    const sp = new URLSearchParams(searchParams.toString());
    sp.delete("new");
    sp.delete("customer");
    const qs = sp.toString();
    router.replace(qs ? `/declarations?${qs}` : "/declarations", { scroll: false });
  }, [searchParams, router]);

  useEffect(() => {
    const openId = searchParams.get("open");
    if (!openId) return;
    openDeclaration(openId, { syncUrl: false });
  }, [searchParams, openDeclaration]);

  function handleSheetOpenChange(next: boolean) {
    setSheetOpen(next);
    if (!next) {
      setSelectedId(null);
      if (searchParams.get("open")) {
        const sp = new URLSearchParams(searchParams.toString());
        sp.delete("open");
        const qs = sp.toString();
        router.replace(qs ? `/declarations?${qs}` : "/declarations", {
          scroll: false,
        });
      }
    }
  }

  function openNewDeclaration(customerId?: string) {
    setPresetCustomerId(customerId);
    setNewDialogOpen(true);
  }

  return (
    <div className="space-y-6">
      <DeclarationSavedViewsBar
        orgViews={orgViews}
        canManage={canEdit}
        viewState={viewState}
        zoneSlugs={zoneSlugs}
        onApplyQuery={applyQuery}
      />

      <DeclarationsToolbar
        state={viewState}
        totalCount={sortedRows.length}
        customers={customers.map((c) => ({ id: c.id, name: c.name }))}
        agencies={agencies}
        today={today}
        exportExcel={
          <DownloadExcelButton exportUrl={declarationsExportUrl} />
        }
        columnSettings={
          tableColumns.ready ? (
            <TableColumnSettings
              columns={DECLARATION_LIST_COLUMNS}
              prefs={tableColumns.prefs}
              onPrefsChange={tableColumns.updatePrefs}
              onReset={tableColumns.resetPrefs}
            />
          ) : null
        }
      />

      {sortedRows.length === 0 ? (
        <div className="rounded-lg border border-dashed bg-muted/30 px-6 py-10 text-center">
          <p className="text-sm text-muted-foreground">
            Aucune déclaration ne correspond à ces filtres.
          </p>
          {canEdit ? (
            <div className="mt-4 flex justify-center">
              <Button
                type="button"
                className="rounded-full"
                onClick={() => openNewDeclaration()}
              >
                <Plus className="size-4" />
                Nouvelle déclaration
              </Button>
            </div>
          ) : null}
        </div>
      ) : groupTree ? (
        <GroupedDeclarationsList nodes={groupTree} />
      ) : (
        <div className="overflow-hidden rounded-lg border bg-card">
          <DeclarationsTable
            rows={pagedRows}
            bare
            ledgerTotals={ledgerTotals}
            visibleColumnIds={
              tableColumns.visibleIds as DeclarationListColumnId[]
            }
            onOpenRow={(id) => openDeclaration(id)}
          />
          <TablePagination
            totalItems={sortedRows.length}
            page={safePage}
            onPageChange={setPage}
            itemLabel="déclaration"
          />
        </div>
      )}

      <DeclarationFicheSheet
        declarationId={selectedId}
        open={sheetOpen}
        onOpenChange={handleSheetOpenChange}
        canEdit={canEdit}
        agencies={agencies}
      />

      {canEdit ? (
        <>
          <NewDeclarationDialog
            open={newDialogOpen}
            onOpenChange={(open) => {
              setNewDialogOpen(open);
              if (!open) setPresetCustomerId(undefined);
            }}
            customers={customers}
            agencies={agencies}
            defaultCustomerId={presetCustomerId}
            onRequestNewClient={() => setNewClientDialogOpen(true)}
            onCreated={(declarationId) => {
              const sp = new URLSearchParams(searchParams.toString());
              sp.set("open", declarationId);
              router.push(`/declarations?${sp.toString()}`);
              router.refresh();
            }}
          />
          <NewCustomerDialog
            open={newClientDialogOpen}
            onOpenChange={setNewClientDialogOpen}
            onCreated={() => router.refresh()}
          />
        </>
      ) : null}
    </div>
  );
}
