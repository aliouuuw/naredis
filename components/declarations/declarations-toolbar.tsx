"use client";

import { useCallback, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { X } from "lucide-react";
import {
  DECLARATION_VIEW_PRESETS,
  SORT_LABELS,
  VIEW_PRESET_LABELS,
  type DeclarationDatePreset,
  type DeclarationSort,
  type DeclarationViewPreset,
  type DeclarationsViewState,
  serializeDeclarationsSearchParams,
  viewHasCustomizations,
} from "@/lib/modules/declarations/declarations-query";
import { pilotZoneOptions } from "@/lib/domain/pilot-zones";
import { Button } from "@/components/ui/button";
import { FormSelect } from "@/components/ui/form-select";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type CustomerOption = { id: string; name: string };

const PERIOD_OPTIONS: { id: DeclarationDatePreset; label: string }[] = [
  { id: "today", label: "Aujourd'hui" },
  { id: "week", label: "Cette semaine" },
  { id: "month", label: "Ce mois" },
  { id: "last30", label: "30 jours" },
  { id: "all", label: "Toutes dates" },
];

export function DeclarationsToolbar({
  state,
  totalCount,
  customers,
}: {
  state: DeclarationsViewState;
  totalCount: number;
  customers: CustomerOption[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [searchDraft, setSearchDraft] = useState(state.search);

  const pushState = useCallback(
    (next: DeclarationsViewState, preserveOpen = true) => {
      const sp = serializeDeclarationsSearchParams(next);
      const open = preserveOpen ? searchParams.get("open") : null;
      if (open) sp.set("open", open);
      const qs = sp.toString();
      startTransition(() => {
        router.push(qs ? `/declarations?${qs}` : "/declarations");
      });
    },
    [router, searchParams],
  );

  function patch(partial: Partial<DeclarationsViewState>) {
    pushState({ ...state, ...partial });
  }

  function resetFilters() {
    setSearchDraft("");
    pushState({
      viewPreset: "all",
      sort: "date-desc",
      datePreset: "all",
      dateFrom: "",
      dateTo: "",
      customerId: "",
      zone: "",
      search: "",
    });
  }

  function submitSearch() {
    patch({ search: searchDraft.trim() });
  }

  const zoneOptions = pilotZoneOptions();
  const customized = viewHasCustomizations(state);

  return (
    <div
      className={cn(
        "space-y-4 rounded-lg border bg-card p-4",
        pending && "opacity-70",
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {DECLARATION_VIEW_PRESETS.map((preset) => (
            <Button
              key={preset}
              type="button"
              size="sm"
              variant={state.viewPreset === preset ? "default" : "outline"}
              className="h-8 rounded-full"
              onClick={() => patch({ viewPreset: preset })}
            >
              {VIEW_PRESET_LABELS[preset]}
            </Button>
          ))}
        </div>
        <p className="text-sm text-muted-foreground tabular-nums">
          {totalCount} déclaration{totalCount === 1 ? "" : "s"}
        </p>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <label htmlFor="decl-search" className="text-xs font-medium text-muted-foreground">
            Recherche
          </label>
          <div className="flex gap-2">
            <Input
              id="decl-search"
              value={searchDraft}
              onChange={(e) => setSearchDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  submitSearch();
                }
              }}
              placeholder="N° décl., BL, client…"
              className="h-9"
            />
            <Button type="button" size="sm" variant="secondary" onClick={submitSearch}>
              Filtrer
            </Button>
          </div>
        </div>

        <div className="grid w-full gap-3 sm:grid-cols-2 lg:w-auto lg:min-w-[420px] lg:grid-cols-4">
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">Client</span>
            <FormSelect
              emptyOption="Tous"
              value={state.customerId}
              onValueChange={(customerId) => patch({ customerId })}
              options={customers.map((c) => ({ value: c.id, label: c.name }))}
              triggerClassName="h-9"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">Zone</span>
            <FormSelect
              emptyOption="Toutes"
              value={state.zone}
              onValueChange={(zone) => patch({ zone })}
              options={zoneOptions}
              triggerClassName="h-9"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">Période</span>
            <Select
              value={state.datePreset}
              onValueChange={(v) =>
                patch({
                  datePreset: v as DeclarationDatePreset,
                  dateFrom: "",
                  dateTo: "",
                })
              }
            >
              <SelectTrigger className="h-9 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PERIOD_OPTIONS.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">Tri</span>
            <Select
              value={state.sort}
              onValueChange={(v) => patch({ sort: v as DeclarationSort })}
            >
              <SelectTrigger className="h-9 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(SORT_LABELS) as DeclarationSort[]).map((key) => (
                  <SelectItem key={key} value={key}>
                    {SORT_LABELS[key]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
