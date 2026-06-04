"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useTransition } from "react";
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
import { mergeZoneSuggestions } from "@/lib/domain/pilot-zones";
import { useOrgFormSuggestions } from "@/components/hooks/use-form-suggestions";
import { Button } from "@/components/ui/button";
import { FormSelect } from "@/components/ui/form-select";
import { FormSuggestInput } from "@/components/ui/form-suggest-input";
import { Input } from "@/components/ui/input";
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
  columnSettings,
  exportExcel,
  searchDraft,
  onSearchDraftChange,
}: {
  state: DeclarationsViewState;
  totalCount: number;
  customers: CustomerOption[];
  columnSettings?: ReactNode;
  exportExcel?: ReactNode;
  searchDraft: string;
  onSearchDraftChange: (value: string) => void;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pushState = useCallback(
    (next: DeclarationsViewState, preserveOpen = true) => {
      const sp = serializeDeclarationsSearchParams(next);
      sp.delete("page");
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
    onSearchDraftChange("");
    pushState({
      viewPreset: "all",
      sort: "date-desc",
      datePreset: "all",
      dateFrom: "",
      dateTo: "",
      customerId: "",
      zone: "",
      search: "",
    }, false);
  }

  // Debounce URL push when the user types in the search box
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (searchDraft.trim() !== state.search.trim()) {
        patch({ search: searchDraft.trim() });
      }
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchDraft]);

  const { suggestions } = useOrgFormSuggestions();
  const zoneSuggestions = useMemo(
    () =>
      mergeZoneSuggestions(
        suggestions?.zoneCatalog ?? [],
        suggestions?.zoneOrTerminals ?? [],
      ),
    [suggestions?.zoneCatalog, suggestions?.zoneOrTerminals],
  );
  const customized = viewHasCustomizations({ ...state, search: searchDraft });

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
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm text-muted-foreground tabular-nums">
            {totalCount} déclaration{totalCount === 1 ? "" : "s"}
          </p>
          {exportExcel}
          {columnSettings}
        </div>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <label htmlFor="decl-search" className="text-xs font-medium text-muted-foreground">
            Recherche
          </label>
          <Input
            id="decl-search"
            value={searchDraft}
            onChange={(e) => onSearchDraftChange(e.target.value)}
            placeholder="N° décl., BL, client…"
            className="h-9"
          />
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
            <FormSuggestInput
              value={state.zone}
              onValueChange={(zone) => patch({ zone: zone.toUpperCase() })}
              suggestions={zoneSuggestions}
              placeholder="Toutes"
              className="h-9 font-mono uppercase"
              helperText=""
              emptyHint="Effacez le champ pour toutes les zones."
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">Période</span>
            <FormSelect
              value={state.datePreset}
              onValueChange={(v) =>
                patch({
                  datePreset: v as DeclarationDatePreset,
                  dateFrom: "",
                  dateTo: "",
                })
              }
              options={PERIOD_OPTIONS.map((p) => ({
                value: p.id,
                label: p.label,
              }))}
              triggerClassName="h-9"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">Tri</span>
            <FormSelect
              value={state.sort}
              onValueChange={(v) => patch({ sort: v as DeclarationSort })}
              options={(Object.keys(SORT_LABELS) as DeclarationSort[]).map(
                (key) => ({
                  value: key,
                  label: SORT_LABELS[key],
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
