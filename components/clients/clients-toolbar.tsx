"use client";

import type { ReactNode } from "react";
import { useCallback, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import {
  CLIENT_SORT_LABELS,
  type ClientSort,
  type ClientsViewState,
  serializeClientsSearchParams,
  viewHasCustomizations,
} from "@/lib/modules/customers/clients-query";
import { Button } from "@/components/ui/button";
import { FormSelect } from "@/components/ui/form-select";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const STATUS_OPTIONS = [
  { value: "", label: "Tous les statuts" },
  { value: "a_jour", label: "À jour" },
  { value: "pas_a_jour", label: "Pas à jour" },
] as const;

export function ClientsToolbar({
  state,
  totalCount,
  columnSettings,
}: {
  state: ClientsViewState;
  totalCount: number;
  columnSettings?: ReactNode;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [searchDraft, setSearchDraft] = useState(state.search);

  const pushState = useCallback(
    (next: ClientsViewState) => {
      const sp = serializeClientsSearchParams(next);
      sp.delete("page");
      const qs = sp.toString();
      startTransition(() => {
        router.push(qs ? `/clients?${qs}` : "/clients");
      });
    },
    [router],
  );

  function patch(partial: Partial<ClientsViewState>) {
    pushState({ ...state, ...partial });
  }

  function resetFilters() {
    setSearchDraft("");
    pushState({
      search: "",
      sort: "name-asc",
      accountStatus: "",
    });
  }

  function submitSearch() {
    patch({ search: searchDraft.trim() });
  }

  const customized = viewHasCustomizations(state);

  return (
    <div
      className={cn(
        "space-y-4 rounded-lg border bg-card p-4",
        pending && "opacity-70",
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Soldes en débit/crédit, frais dossiers cumulés et mouvements du jour.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm text-muted-foreground tabular-nums">
            {totalCount} client{totalCount === 1 ? "" : "s"}
          </p>
          {columnSettings}
        </div>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <label htmlFor="client-search" className="text-xs font-medium text-muted-foreground">
            Recherche
          </label>
          <div className="flex gap-2">
            <Input
              id="client-search"
              value={searchDraft}
              onChange={(e) => setSearchDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  submitSearch();
                }
              }}
              placeholder="Nom, slug, téléphone…"
              className="h-9"
            />
            <Button type="button" size="sm" variant="secondary" onClick={submitSearch}>
              Filtrer
            </Button>
          </div>
        </div>

        <div className="grid w-full gap-3 sm:grid-cols-2 lg:w-auto lg:min-w-[320px]">
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">Statut compte</span>
            <FormSelect
              value={state.accountStatus || "all"}
              onValueChange={(v) =>
                patch({
                  accountStatus:
                    v === "all" ? "" : (v as ClientsViewState["accountStatus"]),
                })
              }
              options={STATUS_OPTIONS.map((o) => ({
                value: o.value || "all",
                label: o.label,
              }))}
              triggerClassName="h-9"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">Tri</span>
            <FormSelect
              value={state.sort}
              onValueChange={(v) => patch({ sort: v as ClientSort })}
              options={(Object.keys(CLIENT_SORT_LABELS) as ClientSort[]).map(
                (key) => ({
                  value: key,
                  label: CLIENT_SORT_LABELS[key],
                }),
              )}
              triggerClassName="h-9"
            />
          </div>
        </div>
      </div>

      {customized ? (
        <div className="flex justify-end">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 gap-1 text-muted-foreground"
            onClick={resetFilters}
          >
            <X className="size-3.5" />
            Réinitialiser les filtres
          </Button>
        </div>
      ) : null}
    </div>
  );
}
