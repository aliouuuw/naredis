"use client";

import type { ReactNode } from "react";
import { useCallback, useMemo, useRef, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, X } from "lucide-react";
import {
  DECLARATION_FILTER_FIELDS,
  DECLARATION_GROUP_DIMENSIONS,
  DECLARATION_VIEW_PRESETS,
  FILTER_FIELD_LABELS,
  GROUP_DIMENSION_LABELS,
  SORT_LABELS,
  VIEW_PRESET_LABELS,
  type DeclarationDatePreset,
  type DeclarationFilterField,
  type DeclarationFilterRule,
  type DeclarationGroupDimension,
  type DeclarationSort,
  type DeclarationViewPreset,
  type DeclarationsViewState,
  formatDeclarationsFilterSummary,
  serializeDeclarationsSearchParams,
  viewHasCustomizations,
} from "@/lib/modules/declarations/declarations-query";
import { newFilterRuleId } from "@/lib/ui/filter-rules";
import { mergeZoneSuggestions } from "@/lib/domain/pilot-zones";
import { useOrgFormSuggestions } from "@/components/hooks/use-form-suggestions";
import { EntityViewToolbarShell } from "@/components/ui/entity-view-toolbar-shell";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FormSelect } from "@/components/ui/form-select";
import { FormSuggestInput } from "@/components/ui/form-suggest-input";
import { Input } from "@/components/ui/input";
import { PeriodDateRange } from "@/components/transactions/period-date-range";
import { agencyDateRangeForPreset } from "@/lib/modules/ledger/transactions-query";

type CustomerOption = { id: string; name: string };
type AgencyOption = { id: string; name: string };

const DATE_PRESETS: { id: DeclarationDatePreset; label: string }[] = [
  { id: "today", label: "Aujourd'hui" },
  { id: "yesterday", label: "Hier" },
  { id: "week", label: "Cette semaine" },
  { id: "month", label: "Ce mois" },
  { id: "last30", label: "30 jours" },
  { id: "all", label: "Toutes dates" },
];

const FILTERABLE_FIELDS: DeclarationFilterField[] = [
  ...DECLARATION_FILTER_FIELDS,
];

function defaultOperator(field: DeclarationFilterField): DeclarationFilterRule["operator"] {
  if (field === "q") return "contains";
  if (
    field === "amountMin" ||
    field === "gaindeMin" ||
    field === "costMin" ||
    field === "containerMin"
  ) {
    return "gte";
  }
  return "eq";
}

function defaultValue(field: DeclarationFilterField): string {
  if (field === "bonADelivrer") return "true";
  return "";
}

function RuleValueEditor({
  rule,
  onChange,
  customers,
  agencies,
  zoneSuggestions,
}: {
  rule: DeclarationFilterRule;
  onChange: (patch: Partial<DeclarationFilterRule>) => void;
  customers: CustomerOption[];
  agencies: AgencyOption[];
  zoneSuggestions: Array<{ value: string; label?: string }>;
}) {
  if (rule.field === "customer") {
    return (
      <FormSelect
        size="sm"
        value={rule.value}
        placeholder="Choisir un client"
        onValueChange={(value) => onChange({ value })}
        options={customers.map((c) => ({ value: c.id, label: c.name }))}
        triggerClassName="min-w-[140px] flex-1"
      />
    );
  }
  if (rule.field === "agency") {
    return (
      <FormSelect
        size="sm"
        value={rule.value}
        placeholder="Maison-mère"
        onValueChange={(value) => onChange({ value })}
        options={agencies.map((a) => ({ value: a.id, label: a.name }))}
        triggerClassName="min-w-[140px] flex-1"
      />
    );
  }
  if (rule.field === "zone") {
    return (
      <FormSuggestInput
        value={rule.value}
        onValueChange={(zone) => onChange({ value: zone.toUpperCase() })}
        suggestions={zoneSuggestions}
        placeholder="Zone"
        className="h-8 min-w-[100px] flex-1 font-mono text-xs uppercase"
        helperText=""
      />
    );
  }
  if (rule.field === "bonADelivrer") {
    return (
      <FormSelect
        size="sm"
        value={rule.value}
        onValueChange={(value) => onChange({ value })}
        options={[
          { value: "true", label: "Coché" },
          { value: "false", label: "Non coché" },
        ]}
        triggerClassName="min-w-[120px] flex-1"
      />
    );
  }
  return (
    <Input
      value={rule.value}
      onChange={(e) => onChange({ value: e.target.value })}
      className="h-8 min-w-[100px] flex-1 text-xs"
      placeholder="Valeur"
    />
  );
}

export function DeclarationsToolbar({
  state,
  totalCount,
  customers,
  agencies,
  today,
  columnSettings,
  exportExcel,
}: {
  state: DeclarationsViewState;
  totalCount: number;
  customers: CustomerOption[];
  agencies: AgencyOption[];
  today: string;
  columnSettings?: ReactNode;
  exportExcel?: ReactNode;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [filtersOpen, setFiltersOpen] = useState(
    () => viewHasCustomizations(state) || state.showLedgerTotals,
  );

  const pushState = useCallback(
    (next: DeclarationsViewState) => {
      const sp = serializeDeclarationsSearchParams(next);
      sp.delete("page");
      const open = searchParams.get("open");
      if (open) sp.set("open", open);
      const qs = sp.toString();
      startTransition(() => {
        router.replace(qs ? `/declarations?${qs}` : "/declarations", {
          scroll: false,
        });
      });
    },
    [router, searchParams],
  );

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pushStateDebounced = useCallback(
    (next: DeclarationsViewState) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => pushState(next), 450);
    },
    [pushState],
  );

  const pushRules = useCallback(
    (rules: DeclarationFilterRule[], debounce: boolean) => {
      const next = { ...state, rules, activeTab: { kind: "table" as const } };
      if (debounce) pushStateDebounced(next);
      else pushState(next);
    },
    [state, pushState, pushStateDebounced],
  );

  const usedGroupDims = useMemo(() => new Set(state.groupBy), [state.groupBy]);
  const availableGroupDims = DECLARATION_GROUP_DIMENSIONS.filter(
    (d) => !usedGroupDims.has(d),
  );

  const { suggestions } = useOrgFormSuggestions();
  const zoneSuggestions = useMemo(
    () =>
      mergeZoneSuggestions(
        suggestions?.zoneCatalog ?? [],
        suggestions?.zoneOrTerminals ?? [],
      ),
    [suggestions?.zoneCatalog, suggestions?.zoneOrTerminals],
  );

  const summary = formatDeclarationsFilterSummary(state, totalCount);

  const applyPreset = (preset: DeclarationDatePreset) => {
    const range = agencyDateRangeForPreset(preset, today);
    pushState({
      ...state,
      datePreset: preset,
      dateFrom: range.dateFrom,
      dateTo: range.dateTo,
    });
  };

  return (
    <EntityViewToolbarShell
      open={filtersOpen}
      onOpenChange={setFiltersOpen}
      summary={summary}
      pending={pending}
      headerActions={
        <>
          <p className="hidden text-sm text-muted-foreground tabular-nums sm:block">
            {totalCount} déclaration{totalCount === 1 ? "" : "s"}
          </p>
          {exportExcel}
          {columnSettings}
        </>
      }
      footer={
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 text-xs">
            <span className="font-medium text-muted-foreground">Tri</span>
            <FormSelect
              size="sm"
              value={state.sort}
              onValueChange={(v) => {
                if (v) pushState({ ...state, sort: v as DeclarationSort });
              }}
              options={(Object.keys(SORT_LABELS) as DeclarationSort[]).map(
                (key) => ({
                  value: key,
                  label: SORT_LABELS[key],
                }),
              )}
              triggerClassName="w-[200px]"
            />
          </label>
          <label className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              className="size-3.5 rounded border"
              checked={state.showLedgerTotals}
              onChange={(e) =>
                pushState({ ...state, showLedgerTotals: e.target.checked })
              }
            />
            <span className="text-muted-foreground">Totaux en pied de tableau</span>
          </label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            onClick={() =>
              pushState({
                activeTab: { kind: "table" },
                viewPreset: "all",
                rules: [],
                groupBy: [],
                sort: "date-desc",
                datePreset: "all",
                dateFrom: "",
                dateTo: "",
                showLedgerTotals: false,
              })
            }
          >
            Réinitialiser la vue
          </Button>
        </div>
      }
    >
      <div className="flex flex-wrap gap-1.5">
        {DECLARATION_VIEW_PRESETS.map((preset) => (
          <Button
            key={preset}
            type="button"
            size="sm"
            variant={state.viewPreset === preset ? "default" : "outline"}
            className="h-8 rounded-full"
            onClick={() =>
              pushState({
                ...state,
                viewPreset: preset,
                activeTab: { kind: "table" },
              })
            }
          >
            {VIEW_PRESET_LABELS[preset]}
          </Button>
        ))}
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Période</p>
        <div className="flex flex-wrap items-center gap-2">
          <FormSelect
            size="sm"
            value={state.datePreset}
            onValueChange={(v) => {
              if (v) applyPreset(v as DeclarationDatePreset);
            }}
            options={DATE_PRESETS.map((p) => ({
              value: p.id,
              label: p.label,
            }))}
            triggerClassName="w-[200px]"
          />
        </div>
        {state.datePreset === "all" ? (
          <PeriodDateRange
            dateFrom={state.dateFrom}
            dateTo={state.dateTo}
            onChange={(dateFrom, dateTo) =>
              pushState({ ...state, dateFrom, dateTo })
            }
          />
        ) : null}
      </div>

      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-medium text-muted-foreground">Filtres</p>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1 text-xs"
                />
              }
            >
              <Plus className="size-3.5" />
              Filtre
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {FILTERABLE_FIELDS.map((f) => (
                <DropdownMenuItem
                  key={f}
                  onClick={() =>
                    pushRules(
                      [
                        ...state.rules,
                        {
                          id: newFilterRuleId(),
                          field: f,
                          operator: defaultOperator(f),
                          value: defaultValue(f),
                        },
                      ],
                      false,
                    )
                  }
                >
                  {FILTER_FIELD_LABELS[f]}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {state.rules.length === 0 ? (
          <p className="text-xs text-muted-foreground">Aucun filtre actif.</p>
        ) : (
          <ul className="space-y-2">
            {state.rules.map((rule) => (
              <li
                key={rule.id}
                className="flex flex-wrap items-center gap-2 rounded-md border bg-muted/20 px-2 py-1.5"
              >
                <span className="text-xs font-medium text-muted-foreground">
                  {FILTER_FIELD_LABELS[rule.field]}
                </span>
                <RuleValueEditor
                  rule={rule}
                  customers={customers}
                  agencies={agencies}
                  zoneSuggestions={zoneSuggestions}
                  onChange={(patch) => {
                    const rules = state.rules.map((r) =>
                      r.id === rule.id ? { ...r, ...patch } : r,
                    );
                    const debounce = [
                      "q",
                      "amountMin",
                      "amountMax",
                      "gaindeMin",
                      "gaindeMax",
                      "costMin",
                      "costMax",
                      "containerMin",
                    ].includes(rule.field);
                    pushRules(rules, debounce);
                  }}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-7 shrink-0"
                  aria-label="Retirer le filtre"
                  onClick={() =>
                    pushState({
                      ...state,
                      rules: state.rules.filter((r) => r.id !== rule.id),
                      activeTab: { kind: "table" },
                    })
                  }
                >
                  <X className="size-3.5" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">
          Regroupement (ordre = niveaux imbriqués)
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {state.groupBy.map((dim, index) => (
            <div
              key={`${dim}-${index}`}
              className="flex items-center gap-1 rounded-full border bg-muted/30 py-0.5 pl-2 pr-1 text-xs"
            >
              <span className="font-medium">
                {GROUP_DIMENSION_LABELS[dim]}
              </span>
              <button
                type="button"
                className="rounded p-0.5 hover:bg-background"
                aria-label="Retirer"
                onClick={() =>
                  pushState({
                    ...state,
                    groupBy: state.groupBy.filter((_, i) => i !== index),
                  })
                }
              >
                <X className="size-3" />
              </button>
            </div>
          ))}
          {availableGroupDims.length > 0 ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 rounded-full px-2 text-xs"
                  />
                }
              >
                + Regroupement
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {availableGroupDims.map((d) => (
                  <DropdownMenuItem
                    key={d}
                    onClick={() =>
                      pushState({
                        ...state,
                        groupBy: [...state.groupBy, d],
                      })
                    }
                  >
                    {GROUP_DIMENSION_LABELS[d]}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
          {state.groupBy.length > 0 ? (
            <button
              type="button"
              className="text-xs text-muted-foreground underline"
              onClick={() => pushState({ ...state, groupBy: [] })}
            >
              Liste plate
            </button>
          ) : null}
        </div>
      </div>
    </EntityViewToolbarShell>
  );
}
