"use client";

import { useCallback, useMemo, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
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
  serializeTransactionsSearchParams,
} from "@/lib/modules/ledger/transactions-query";
import { Button } from "@/components/ui/button";

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
      <select
        value={rule.value}
        onChange={(e) => onChange({ value: e.target.value })}
        className="h-8 min-w-[140px] flex-1 rounded-lg border border-input bg-background px-2 text-sm"
      >
        <option value="">Choisir…</option>
        {customers.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
    );
  }
  if (rule.field === "type") {
    return (
      <select
        value={rule.value}
        onChange={(e) => onChange({ value: e.target.value })}
        className="h-8 min-w-[140px] flex-1 rounded-lg border border-input bg-background px-2 text-sm"
      >
        <option value="">Choisir…</option>
        {types.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>
    );
  }
  if (rule.field === "side") {
    return (
      <select
        value={rule.value}
        onChange={(e) => onChange({ value: e.target.value })}
        className="h-8 rounded-lg border border-input bg-background px-2 text-sm"
      >
        <option value="credit">Crédit</option>
        <option value="debit">Débit</option>
      </select>
    );
  }
  if (rule.field === "entryType") {
    return (
      <select
        value={rule.value}
        onChange={(e) => onChange({ value: e.target.value })}
        className="h-8 min-w-[140px] flex-1 rounded-lg border border-input bg-background px-2 text-sm"
      >
        <option value="">Choisir…</option>
        {ENTRY_TYPE_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    );
  }
  if (rule.field === "category") {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={rule.operator}
          onChange={(e) =>
            onChange({ operator: e.target.value as FilterOperator })
          }
          className="h-8 rounded-lg border border-input bg-background px-2 text-sm"
        >
          <option value="eq">est</option>
          <option value="empty">est vide</option>
        </select>
        {rule.operator !== "empty" ? (
          <select
            value={rule.value}
            onChange={(e) => onChange({ value: e.target.value })}
            className="h-8 min-w-[120px] flex-1 rounded-lg border border-input bg-background px-2 text-sm"
          >
            <option value="">Choisir…</option>
            {CATEGORY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        ) : null}
      </div>
    );
  }
  if (rule.field === "dossier") {
    return (
      <select
        value={rule.value}
        onChange={(e) => onChange({ value: e.target.value })}
        className="h-8 min-w-[140px] flex-1 rounded-lg border border-input bg-background px-2 text-sm"
      >
        <option value="">Choisir…</option>
        {dossiers.map((d) => (
          <option key={d.id} value={d.id}>
            {d.dossierNumber}
            {d.blReference ? ` · BL ${d.blReference}` : ""}
          </option>
        ))}
      </select>
    );
  }
  if (rule.field === "hasDossier") {
    return (
      <select
        value={rule.value}
        onChange={(e) => onChange({ value: e.target.value })}
        className="h-8 rounded-lg border border-input bg-background px-2 text-sm"
      >
        <option value="true">Oui</option>
        <option value="false">Non</option>
      </select>
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

export function TransactionsToolbar({
  state,
  totalCount,
  customers,
  transactionTypes,
  dossiers,
  today,
}: {
  state: TransactionsViewState;
  totalCount: number;
  customers: CustomerOption[];
  transactionTypes: TransactionTypeSerialized[];
  dossiers: DossierAllocationOption[];
  today: string;
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

  return (
    <section className="space-y-4 rounded-lg border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">Vue transactions</h2>
        <p className="text-xs text-muted-foreground">
          {pending ? "Mise à jour…" : null}
          {totalCount} résultat{totalCount !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Période</p>
        <div className="flex flex-wrap gap-1.5">
          {DATE_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                const range = agencyDateRangeForPreset(p.id, today);
                pushState({
                  ...state,
                  datePreset: p.id,
                  dateFrom: range.dateFrom,
                  dateTo: range.dateTo,
                });
              }}
              className={
                state.datePreset === p.id
                  ? "rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground"
                  : "rounded-full border px-3 py-1 text-xs text-muted-foreground hover:bg-muted"
              }
            >
              {p.label}
            </button>
          ))}
        </div>
        {state.datePreset === "all" ? (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <label className="flex items-center gap-1.5 text-xs">
              <span className="text-muted-foreground">Du</span>
              <input
                type="date"
                value={state.dateFrom}
                onChange={(e) =>
                  pushState({ ...state, dateFrom: e.target.value })
                }
                className="h-8 rounded-lg border border-input bg-background px-2 text-sm"
              />
            </label>
            <label className="flex items-center gap-1.5 text-xs">
              <span className="text-muted-foreground">Au</span>
              <input
                type="date"
                value={state.dateTo}
                onChange={(e) =>
                  pushState({ ...state, dateTo: e.target.value })
                }
                className="h-8 rounded-lg border border-input bg-background px-2 text-sm"
              />
            </label>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground tabular-nums">
            {state.dateFrom || "—"} → {state.dateTo || "—"}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-medium text-muted-foreground">Filtres</p>
          <div>
            <select
              aria-label="Ajouter un filtre"
              className="h-8 appearance-none rounded-lg border border-dashed border-input bg-background pl-2 pr-8 text-xs font-medium"
              defaultValue=""
              onChange={(e) => {
                const field = e.target.value as FilterField;
                if (!field) return;
                pushRules(
                  [
                    ...state.rules,
                    {
                      id: newRuleId(),
                      field,
                      operator: defaultOperator(field),
                      value: defaultValue(field),
                    },
                  ],
                  false,
                );
                e.target.value = "";
              }}
            >
              <option value="">+ Filtre</option>
              {FILTERABLE_FIELDS.filter(
                (f) =>
                  f !== "dossier" ||
                  Boolean(customerFromRules) ||
                  dossiers.length > 0,
              ).map((f) => (
                <option key={f} value={f}>
                  {FILTER_FIELD_LABELS[f]}
                </option>
              ))}
            </select>
          </div>
        </div>

        {state.rules.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            Aucun filtre actif — toutes les écritures de la période sont
            incluses.
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
                {ruleLabel(rule, customers, transactionTypes, dossiers)}
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
              <span className="font-medium">{GROUP_DIMENSION_LABELS[dim]}</span>
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
            <select
              className="h-7 rounded-full border border-dashed border-input bg-background px-2 text-xs"
              defaultValue=""
              onChange={(e) => {
                const dim = e.target.value as GroupDimension;
                if (!dim) return;
                pushState({
                  ...state,
                  groupBy: [...state.groupBy, dim],
                });
                e.target.value = "";
              }}
            >
              <option value="">+ Regroupement</option>
              {availableGroupDims.map((d) => (
                <option key={d} value={d}>
                  {GROUP_DIMENSION_LABELS[d]}
                </option>
              ))}
            </select>
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
          <select
            value={state.sort}
            onChange={(e) =>
              pushState({
                ...state,
                sort: e.target.value as TransactionsSort,
              })
            }
            className="h-8 rounded-lg border border-input bg-background px-2 text-sm"
          >
            {SORT_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {SORT_LABELS[s]}
              </option>
            ))}
          </select>
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
    </section>
  );
}
