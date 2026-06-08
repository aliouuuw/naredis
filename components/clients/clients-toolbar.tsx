"use client";

import type { ReactNode } from "react";
import { useCallback, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import {
  CLIENT_FILTER_FIELDS,
  CLIENT_FILTER_FIELD_LABELS,
  CLIENT_GROUP_DIMENSIONS,
  CLIENT_GROUP_LABELS,
  CLIENT_SORT_LABELS,
  formatClientsFilterSummary,
  type ClientFilterField,
  type ClientFilterRule,
  type ClientGroupDimension,
  type ClientSort,
  type ClientsViewState,
  serializeClientsSearchParams,
  viewHasCustomizations,
} from "@/lib/modules/customers/clients-query";
import { newFilterRuleId } from "@/lib/ui/filter-rules";
import { EntityViewToolbarShell } from "@/components/ui/entity-view-toolbar-shell";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FormSelect } from "@/components/ui/form-select";
import { Input } from "@/components/ui/input";

const STATUS_OPTIONS = [
  { value: "a_jour", label: "À jour" },
  { value: "pas_a_jour", label: "Pas à jour" },
] as const;

function defaultOperator(field: ClientFilterField): ClientFilterRule["operator"] {
  if (field === "q") return "contains";
  if (field.startsWith("balance") || field.startsWith("fees") || field === "txTodayMin") {
    return "gte";
  }
  return "eq";
}

function RuleValueEditor({
  rule,
  onChange,
}: {
  rule: ClientFilterRule;
  onChange: (patch: Partial<ClientFilterRule>) => void;
}) {
  if (rule.field === "accountStatus") {
    return (
      <FormSelect
        size="sm"
        value={rule.value}
        onValueChange={(value) => onChange({ value })}
        options={STATUS_OPTIONS.map((o) => ({
          value: o.value,
          label: o.label,
        }))}
        triggerClassName="min-w-[140px] flex-1"
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
  const [filtersOpen, setFiltersOpen] = useState(() => viewHasCustomizations(state));

  const pushState = useCallback(
    (next: ClientsViewState) => {
      const sp = serializeClientsSearchParams(next);
      sp.delete("page");
      const qs = sp.toString();
      startTransition(() => {
        router.replace(qs ? `/clients?${qs}` : "/clients", { scroll: false });
      });
    },
    [router],
  );

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pushStateDebounced = useCallback(
    (next: ClientsViewState) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => pushState(next), 450);
    },
    [pushState],
  );

  const pushRules = useCallback(
    (rules: ClientFilterRule[], debounce: boolean) => {
      const next = { ...state, rules };
      if (debounce) pushStateDebounced(next);
      else pushState(next);
    },
    [state, pushState, pushStateDebounced],
  );

  const usedGroupDims = new Set(state.groupBy);
  const availableGroupDims = CLIENT_GROUP_DIMENSIONS.filter(
    (d) => !usedGroupDims.has(d),
  );

  const summary = formatClientsFilterSummary(state, totalCount);

  return (
    <EntityViewToolbarShell
      open={filtersOpen}
      onOpenChange={setFiltersOpen}
      summary={summary}
      pending={pending}
      headerActions={
        <>
          <p className="hidden text-sm text-muted-foreground tabular-nums sm:block">
            {totalCount} client{totalCount === 1 ? "" : "s"}
          </p>
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
                if (v) pushState({ ...state, sort: v as ClientSort });
              }}
              options={(Object.keys(CLIENT_SORT_LABELS) as ClientSort[]).map(
                (key) => ({
                  value: key,
                  label: CLIENT_SORT_LABELS[key],
                }),
              )}
              triggerClassName="w-[200px]"
            />
          </label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            onClick={() =>
              pushState({ rules: [], groupBy: [], sort: "name-asc" })
            }
          >
            Réinitialiser la vue
          </Button>
        </div>
      }
    >
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
              {CLIENT_FILTER_FIELDS.map((f) => (
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
                          value: "",
                        },
                      ],
                      false,
                    )
                  }
                >
                  {CLIENT_FILTER_FIELD_LABELS[f]}
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
                  {CLIENT_FILTER_FIELD_LABELS[rule.field]}
                </span>
                <RuleValueEditor
                  rule={rule}
                  onChange={(patch) => {
                    const rules = state.rules.map((r) =>
                      r.id === rule.id ? { ...r, ...patch } : r,
                    );
                    const debounce = [
                      "q",
                      "balanceMin",
                      "balanceMax",
                      "feesMin",
                      "feesMax",
                      "txTodayMin",
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
          Regroupement
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {state.groupBy.map((dim, index) => (
            <div
              key={`${dim}-${index}`}
              className="flex items-center gap-1 rounded-full border bg-muted/30 py-0.5 pl-2 pr-1 text-xs"
            >
              <span className="font-medium">{CLIENT_GROUP_LABELS[dim]}</span>
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
                    {CLIENT_GROUP_LABELS[d]}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </div>
      </div>
    </EntityViewToolbarShell>
  );
}
