"use client";

import { useCallback, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Plus, X } from "lucide-react";
import type { TransactionTypeSerialized } from "@/lib/modules/ledger/serialize";
import type { DossierAllocationOption } from "@/lib/modules/ledger/service";
import {
  FILTER_FIELD_LABELS,
  GROUP_DIMENSION_LABELS,
  GROUP_DIMENSIONS,
  SORT_OPTIONS,
  type DatePreset,
  type FilterField,
  type FilterOperator,
  type GroupDimension,
  type TransactionFilterRule,
  type TransactionsSort,
  type TransactionsViewState,
  agencyDateRangeForPreset,
  formatPeriodSummary,
  formatViewSummary,
  serializeTransactionsSearchParams,
  viewHasCustomizations,
} from "@/lib/modules/ledger/transactions-query";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PeriodDateRange } from "./period-date-range";
import { cn } from "@/lib/utils";

type CustomerOption = { id: string; name: string };

const DATE_PRESETS: { id: DatePreset; label: string }[] = [
  { id: "today", label: "Aujourd'hui" },
  { id: "yesterday", label: "Hier" },
  { id: "week", label: "Cette semaine" },
  { id: "month", label: "Ce mois" },
  { id: "last30", label: "30 derniers jours" },
  { id: "all", label: "Tout" },
];

const ENTRY_TYPE_OPTIONS = [
  { value: "versement", label: "Versement" },
  { value: "charge", label: "Charge" },
  { value: "opening_balance", label: "Solde d'ouverture" },
  { value: "reversal", label: "Contre-passation" },
] as const;

const CATEGORY_OPTIONS = [
  { value: "honoraires", label: "Honoraires" },
  { value: "debours", label: "Débours" },
  { value: "other", label: "Autre" },
] as const;

const SORT_LABELS: Record<TransactionsSort, string> = {
  "date-desc": "Date (récent)",
  "date-asc": "Date (ancien)",
  "amount-desc": "Montant (décroissant)",
  "amount-asc": "Montant (croissant)",
  "client-asc": "Client (A→Z)",
  "client-desc": "Client (Z→A)",
};

const FILTERABLE_FIELDS: FilterField[] = [
  "customer",
  "type",
  "side",
  "entryType",
  "category",
  "dossier",
  "hasDossier",
  "q",
  "amountMin",
  "amountMax",
];

function newRuleId(): string {
  return `r_${Math.random().toString(36).slice(2, 9)}`;
}

function defaultOperator(field: FilterField): FilterOperator {
  if (field === "q") return "contains";
  if (field === "amountMin") return "gte";
  if (field === "amountMax") return "lte";
  if (field === "hasDossier") return "eq";
  if (field === "category") return "eq";
  return "eq";
}

function defaultValue(field: FilterField): string {
  if (field === "side") return "credit";
  if (field === "hasDossier") return "true";
  return "";
}

function ruleLabel(
  rule: TransactionFilterRule,
  customers: CustomerOption[],
  types: TransactionTypeSerialized[],
  dossiers: DossierAllocationOption[],
): string {
  const field = FILTER_FIELD_LABELS[rule.field];
  if (rule.field === "customer") {
    const name =
      customers.find((c) => c.id === rule.value)?.name ?? rule.value;
    return `${field} : ${name}`;
  }
  if (rule.field === "type") {
    const name = types.find((t) => t.id === rule.value)?.name ?? rule.value;
    return `${field} : ${name}`;
  }
  if (rule.field === "side") {
    return `${field} : ${rule.value === "credit" ? "Crédit" : "Débit"}`;
  }
  if (rule.field === "entryType") {
    const label =
      ENTRY_TYPE_OPTIONS.find((o) => o.value === rule.value)?.label ??
      rule.value;
    return `${field} : ${label}`;
  }
  if (rule.field === "category" && rule.operator === "empty") {
    return `${field} : vide`;
  }
  if (rule.field === "category") {
    const label =
      CATEGORY_OPTIONS.find((o) => o.value === rule.value)?.label ?? rule.value;
    return `${field} : ${label}`;
  }
  if (rule.field === "dossier") {
    const label =
      dossiers.find((d) => d.id === rule.value)?.dossierNumber ?? rule.value;
    return `${field} : ${label}`;
  }
  if (rule.field === "hasDossier") {
    return `${field} : ${rule.value === "true" ? "oui" : "non"}`;
  }
  if (rule.field === "amountMin" || rule.field === "amountMax") {
    return `${field} : ${rule.value}`;
  }
  return `${field} : ${rule.value}`;
}

function FilterValueSelect({
  value,
  placeholder,
  onValueChange,
  options,
}: {
  value: string;
  placeholder: string;
  onValueChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <Select value={value || null} onValueChange={(v) => onValueChange(v ?? "")}>
      <SelectTrigger size="sm" className="min-w-[140px] flex-1">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function RuleValueEditor({
  rule,
  onChange,
  customers,
  types,
  dossiers,
}: {
  rule: TransactionFilterRule;
  onChange: (patch: Partial<TransactionFilterRule>) => void;
  customers: CustomerOption[];
  types: TransactionTypeSerialized[];
  dossiers: DossierAllocationOption[];
}) {
  if (rule.field === "customer") {
    return (
      <FilterValueSelect
        value={rule.value}
        placeholder="Choisir un client"
        onValueChange={(value) => onChange({ value })}
        options={customers.map((c) => ({ value: c.id, label: c.name }))}
      />
    );
  }
  if (rule.field === "type") {
    return (
      <FilterValueSelect
        value={rule.value}
        placeholder="Choisir un type"
        onValueChange={(value) => onChange({ value })}
        options={transactionTypesToOptions(types)}
      />
    );
  }
  if (rule.field === "side") {
    return (
      <FilterValueSelect
        value={rule.value}
        placeholder="Sens"
        onValueChange={(value) => onChange({ value })}
        options={[
          { value: "credit", label: "Crédit" },
          { value: "debit", label: "Débit" },
        ]}
      />
    );
  }
  if (rule.field === "entryType") {
    return (
      <FilterValueSelect
        value={rule.value}
        placeholder="Nature"
        onValueChange={(value) => onChange({ value })}
        options={ENTRY_TYPE_OPTIONS.map((o) => ({
          value: o.value,
          label: o.label,
        }))}
      />
    );
  }
  if (rule.field === "category") {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={rule.operator}
          onValueChange={(v) =>
            onChange({ operator: (v ?? "eq") as FilterOperator })
          }
        >
          <SelectTrigger size="sm" className="w-[100px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="eq">est</SelectItem>
            <SelectItem value="empty">est vide</SelectItem>
          </SelectContent>
        </Select>
        {rule.operator !== "empty" ? (
          <FilterValueSelect
            value={rule.value}
            placeholder="Catégorie"
            onValueChange={(value) => onChange({ value })}
            options={CATEGORY_OPTIONS.map((o) => ({
              value: o.value,
              label: o.label,
            }))}
          />
        ) : null}
      </div>
    );
  }
  if (rule.field === "dossier") {
    return (
      <FilterValueSelect
        value={rule.value}
        placeholder="Dossier"
        onValueChange={(value) => onChange({ value })}
        options={dossiers.map((d) => ({
          value: d.id,
          label: `${d.dossierNumber}${d.blReference ? ` · BL ${d.blReference}` : ""}`,
        }))}
      />
    );
  }
  if (rule.field === "hasDossier") {
    return (
      <FilterValueSelect
        value={rule.value}
        placeholder="Dossier lié"
        onValueChange={(value) => onChange({ value })}
        options={[
          { value: "true", label: "Oui" },
          { value: "false", label: "Non" },
        ]}
      />
    );
  }
  if (rule.field === "q") {
    return (
      <input
        type="search"
        value={rule.value}
        onChange={(e) => onChange({ value: e.target.value })}
        placeholder="Libellé ou note…"
        className="h-8 min-w-[160px] flex-1 rounded-lg border border-input bg-background px-2 text-sm"
      />
    );
  }
  return (
    <input
      type="text"
      inputMode="numeric"
      value={rule.value}
      onChange={(e) => onChange({ value: e.target.value })}
      placeholder="Montant XOF"
      className="h-8 w-36 rounded-lg border border-input bg-background px-2 text-sm tabular-nums"
    />
  );
}

function transactionTypesToOptions(types: TransactionTypeSerialized[]) {
  return types.map((t) => ({
    value: t.id,
    label: `${t.name} (${t.balanceSide === "credit" ? "Crédit" : "Débit"})`,
  }));
}

export function TransactionsToolbar({
  state,
  totalCount,
  customers,
  transactionTypes,
  dossiers,
  today,
  defaultFiltersOpen,
}: {
  state: TransactionsViewState;
  totalCount: number;
  customers: CustomerOption[];
  transactionTypes: TransactionTypeSerialized[];
  dossiers: DossierAllocationOption[];
  today: string;
  defaultFiltersOpen?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const pushState = useCallback(
    (next: TransactionsViewState) => {
      const qs = serializeTransactionsSearchParams(next).toString();
      startTransition(() => {
        router.replace(qs ? `/transactions?${qs}` : "/transactions", {
          scroll: false,
        });
      });
    },
    [router],
  );

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pushStateDebounced = useCallback(
    (next: TransactionsViewState) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => pushState(next), 450);
    },
    [pushState],
  );

  const pushRules = useCallback(
    (rules: TransactionFilterRule[], debounce: boolean) => {
      const next = { ...state, rules };
      if (debounce) pushStateDebounced(next);
      else pushState(next);
    },
    [state, pushState, pushStateDebounced],
  );

  const usedGroupDims = useMemo(() => new Set(state.groupBy), [state.groupBy]);
  const availableGroupDims = GROUP_DIMENSIONS.filter(
    (d) => !usedGroupDims.has(d),
  );

  const customerFromRules = state.rules.find(
    (r) => r.field === "customer" && r.operator === "eq",
  )?.value;

  const summary = formatViewSummary(state, totalCount);
  const [filtersOpen, setFiltersOpen] = useState(
    () => defaultFiltersOpen ?? viewHasCustomizations(state),
  );

  const applyPreset = (preset: DatePreset) => {
    const range = agencyDateRangeForPreset(preset, today);
    pushState({
      ...state,
      datePreset: preset,
      dateFrom: range.dateFrom,
      dateTo: range.dateTo,
    });
  };

  return (
    <section className="rounded-lg border bg-card">
      <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
        <div className="flex items-start gap-2 p-3">
          <CollapsibleTrigger
            className={cn(
              "group/trigger flex flex-1 items-start gap-2 rounded-md text-left outline-none",
              "focus-visible:ring-3 focus-visible:ring-ring/50",
            )}
          >
            <ChevronDown className="mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform group-data-panel-open/trigger:rotate-180" />
            <div className="min-w-0 flex-1 space-y-0.5">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-sm font-semibold">Filtres et vue</h2>
                {pending ? (
                  <span className="text-xs text-muted-foreground">
                    Mise à jour…
                  </span>
                ) : null}
              </div>
              <p className="text-xs text-muted-foreground">{summary}</p>
            </div>
          </CollapsibleTrigger>
        </div>

        <CollapsibleContent className="border-t px-3 pb-3 pt-2">
          <div className="space-y-5">
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">
                Période
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <Select
                  value={state.datePreset}
                  onValueChange={(v) => {
                    if (v) applyPreset(v as DatePreset);
                  }}
                >
                  <SelectTrigger size="sm" className="w-[200px]">
                    <SelectValue placeholder="Période" />
                  </SelectTrigger>
                  <SelectContent>
                    {DATE_PRESETS.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {state.datePreset !== "all" ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() =>
                      pushState({
                        ...state,
                        datePreset: "all",
                        dateFrom: state.dateFrom,
                        dateTo: state.dateTo,
                      })
                    }
                  >
                    Plage personnalisée
                  </Button>
                ) : null}
              </div>
              {state.datePreset === "all" ? (
                <div className="space-y-1.5">
                  <PeriodDateRange
                    dateFrom={state.dateFrom}
                    dateTo={state.dateTo}
                    onChange={(dateFrom, dateTo) =>
                      pushState({ ...state, dateFrom, dateTo })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Sans dates sélectionnées : toutes les écritures de
                    l&apos;organisation sont incluses.
                  </p>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground tabular-nums">
                  {formatPeriodSummary(state)}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-medium text-muted-foreground">
                  Filtres
                </p>
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
                    {FILTERABLE_FIELDS.filter(
                      (f) =>
                        f !== "dossier" ||
                        Boolean(customerFromRules) ||
                        dossiers.length > 0,
                    ).map((f) => (
                      <DropdownMenuItem
                        key={f}
                        onClick={() =>
                          pushRules(
                            [
                              ...state.rules,
                              {
                                id: newRuleId(),
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
                <p className="text-xs text-muted-foreground">
                  Aucun filtre actif.
                </p>
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
                        types={transactionTypes}
                        dossiers={dossiers}
                        onChange={(patch) => {
                          const rules = state.rules.map((r) =>
                            r.id === rule.id ? { ...r, ...patch } : r,
                          );
                          const debounce =
                            rule.field === "q" ||
                            rule.field === "amountMin" ||
                            rule.field === "amountMax";
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
                          })
                        }
                      >
                        <X className="size-3.5" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}

              {state.rules.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {state.rules.map((rule) => (
                    <span
                      key={`chip-${rule.id}`}
                      className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs"
                    >
                      {ruleLabel(
                        rule,
                        customers,
                        transactionTypes,
                        dossiers,
                      )}
                      <button
                        type="button"
                        className="rounded p-0.5 hover:bg-background"
                        aria-label="Retirer"
                        onClick={() =>
                          pushState({
                            ...state,
                            rules: state.rules.filter((r) => r.id !== rule.id),
                          })
                        }
                      >
                        <X className="size-3" />
                      </button>
                    </span>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">
                Regroupement (ordre = niveaux imbriqués)
              </p>
              <div className="flex flex-wrap items-center gap-2">
                {state.groupBy.map((dim, index) => (
                  <div
                    key={`${dim}-${index}`}
                    className="flex items-center gap-1 rounded-full border bg-muted/30 pl-2 pr-1 py-0.5 text-xs"
                  >
                    <span className="font-medium">
                      {GROUP_DIMENSION_LABELS[dim]}
                    </span>
                    <button
                      type="button"
                      className="rounded p-0.5 hover:bg-background disabled:opacity-30"
                      disabled={index === 0}
                      aria-label="Monter"
                      onClick={() => {
                        const groupBy = [...state.groupBy];
                        [groupBy[index - 1], groupBy[index]] = [
                          groupBy[index],
                          groupBy[index - 1],
                        ];
                        pushState({ ...state, groupBy });
                      }}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      className="rounded p-0.5 hover:bg-background disabled:opacity-30"
                      disabled={index === state.groupBy.length - 1}
                      aria-label="Descendre"
                      onClick={() => {
                        const groupBy = [...state.groupBy];
                        [groupBy[index], groupBy[index + 1]] = [
                          groupBy[index + 1],
                          groupBy[index],
                        ];
                        pushState({ ...state, groupBy });
                      }}
                    >
                      ↓
                    </button>
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

            <div className="flex flex-wrap items-center gap-3 border-t pt-3">
              <label className="flex items-center gap-2 text-xs">
                <span className="font-medium text-muted-foreground">Tri</span>
                <Select
                  value={state.sort}
                  onValueChange={(v) => {
                    if (v) pushState({ ...state, sort: v as TransactionsSort });
                  }}
                >
                  <SelectTrigger size="sm" className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SORT_OPTIONS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {SORT_LABELS[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                onClick={() =>
                  pushState({
                    rules: [],
                    groupBy: ["day"],
                    sort: "date-desc",
                    datePreset: "today",
                    ...agencyDateRangeForPreset("today", today),
                  })
                }
              >
                Réinitialiser la vue
              </Button>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </section>
  );
}
