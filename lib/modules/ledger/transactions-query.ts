import type { BalanceSide } from "@/lib/db/enums";
import type { LedgerEntrySerialized } from "./serialize";
import type { LedgerListFilters } from "./service";

/** Dimensions available for stacked grouping (first = outermost). */
export const GROUP_DIMENSIONS = [
  "day",
  "week",
  "month",
  "client",
  "type",
  "side",
  "entryType",
  "category",
  "dossier",
] as const;

export type GroupDimension = (typeof GROUP_DIMENSIONS)[number];

export const SORT_OPTIONS = [
  "date-desc",
  "date-asc",
  "amount-desc",
  "amount-asc",
  "client-asc",
  "client-desc",
] as const;

export type TransactionsSort = (typeof SORT_OPTIONS)[number];

export type FilterField =
  | "customer"
  | "type"
  | "side"
  | "entryType"
  | "category"
  | "dossier"
  | "q"
  | "amountMin"
  | "amountMax"
  | "hasDossier";

export type FilterOperator = "eq" | "neq" | "gte" | "lte" | "contains" | "empty";

export type TransactionFilterRule = {
  id: string;
  field: FilterField;
  operator: FilterOperator;
  value: string;
};

export type DatePreset =
  | "today"
  | "yesterday"
  | "week"
  | "month"
  | "last30"
  | "all";

export type TransactionsViewState = {
  rules: TransactionFilterRule[];
  groupBy: GroupDimension[];
  sort: TransactionsSort;
  datePreset: DatePreset;
  dateFrom: string;
  dateTo: string;
};

export const GROUP_DIMENSION_LABELS: Record<GroupDimension, string> = {
  day: "Jour",
  week: "Semaine",
  month: "Mois",
  client: "Client",
  type: "Type",
  side: "Sens",
  entryType: "Nature système",
  category: "Catégorie",
  dossier: "Dossier",
};

export const FILTER_FIELD_LABELS: Record<FilterField, string> = {
  customer: "Client",
  type: "Type de transaction",
  side: "Sens",
  entryType: "Nature système",
  category: "Catégorie",
  dossier: "Dossier",
  q: "Recherche",
  amountMin: "Montant min.",
  amountMax: "Montant max.",
  hasDossier: "Lié à un dossier",
};

const ENTRY_TYPE_LABELS: Record<string, string> = {
  versement: "Versement",
  charge: "Charge",
  opening_balance: "Solde d'ouverture",
  reversal: "Contre-passation",
};

const CATEGORY_LABELS: Record<string, string> = {
  honoraires: "Honoraires",
  debours: "Débours",
  other: "Autre",
};

function newRuleId(): string {
  return `r_${Math.random().toString(36).slice(2, 9)}`;
}

export function agencyDateRangeForPreset(
  preset: DatePreset,
  today: string,
): { dateFrom: string; dateTo: string } {
  if (preset === "all") {
    return { dateFrom: "", dateTo: "" };
  }

  const base = new Date(`${today}T12:00:00Z`);

  if (preset === "today") {
    return { dateFrom: today, dateTo: today };
  }

  if (preset === "yesterday") {
    base.setUTCDate(base.getUTCDate() - 1);
    const y = base.toISOString().slice(0, 10);
    return { dateFrom: y, dateTo: y };
  }

  if (preset === "week") {
    const day = base.getUTCDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    base.setUTCDate(base.getUTCDate() + diffToMonday);
    const from = base.toISOString().slice(0, 10);
    return { dateFrom: from, dateTo: today };
  }

  if (preset === "month") {
    const from = `${today.slice(0, 7)}-01`;
    return { dateFrom: from, dateTo: today };
  }

  // last30
  base.setUTCDate(base.getUTCDate() - 29);
  return { dateFrom: base.toISOString().slice(0, 10), dateTo: today };
}

function parseFilterToken(raw: string): TransactionFilterRule | null {
  const parts = raw.split(":");
  if (parts.length < 2) return null;
  const [field, operator, ...rest] = parts;
  const value = rest.join(":");

  const validFields: FilterField[] = [
    "customer",
    "type",
    "side",
    "entryType",
    "category",
    "dossier",
    "q",
    "amountMin",
    "amountMax",
    "hasDossier",
  ];
  const validOps: FilterOperator[] = [
    "eq",
    "neq",
    "gte",
    "lte",
    "contains",
    "empty",
  ];

  if (!validFields.includes(field as FilterField)) return null;
  if (!validOps.includes(operator as FilterOperator)) return null;

  return {
    id: newRuleId(),
    field: field as FilterField,
    operator: operator as FilterOperator,
    value,
  };
}

function ruleFromLegacyParams(params: Record<string, string | undefined>): TransactionFilterRule[] {
  const rules: TransactionFilterRule[] = [];
  if (params.customer) {
    rules.push({
      id: newRuleId(),
      field: "customer",
      operator: "eq",
      value: params.customer,
    });
  }
  return rules;
}

export function parseTransactionsViewState(
  params: Record<string, string | string[] | undefined>,
  today: string,
): TransactionsViewState {
  const single = (key: string): string | undefined => {
    const v = params[key];
    if (Array.isArray(v)) return v[0];
    return v;
  };

  const rawRules = params.f;
  const tokens = Array.isArray(rawRules)
    ? rawRules
    : rawRules
      ? [rawRules]
      : [];

  const parsedRules = tokens
    .map((t) => parseFilterToken(t))
    .filter((r): r is TransactionFilterRule => r !== null);

  const legacy = ruleFromLegacyParams({
    customer: single("customer"),
  });

  const rules = [...legacy, ...parsedRules].filter(
    (rule, index, arr) =>
      arr.findIndex(
        (r) =>
          r.field === rule.field &&
          r.operator === rule.operator &&
          r.value === rule.value,
      ) === index,
  );

  const groupRaw = single("group");
  const groupBy =
    groupRaw === "none"
      ? []
      : (groupRaw ?? "day")
          .split(",")
          .map((s) => s.trim())
          .filter((s): s is GroupDimension =>
            (GROUP_DIMENSIONS as readonly string[]).includes(s),
          );

  const sortRaw = single("sort") ?? "date-desc";
  const sort = (SORT_OPTIONS as readonly string[]).includes(sortRaw)
    ? (sortRaw as TransactionsSort)
    : "date-desc";

  const presetRaw = single("preset") ?? "today";
  const datePreset = (
    ["today", "yesterday", "week", "month", "last30", "all"] as const
  ).includes(presetRaw as DatePreset)
    ? (presetRaw as DatePreset)
    : "today";

  const explicitFrom = single("from");
  const explicitTo = single("to");

  let dateFrom = explicitFrom ?? "";
  let dateTo = explicitTo ?? "";

  if (!explicitFrom && !explicitTo && datePreset !== "all") {
    const range = agencyDateRangeForPreset(datePreset, today);
    dateFrom = range.dateFrom;
    dateTo = range.dateTo;
  }

  return {
    rules,
    groupBy:
      groupRaw === undefined && groupBy.length === 0
        ? ["day"]
        : groupBy,
    sort,
    datePreset: explicitFrom || explicitTo ? "all" : datePreset,
    dateFrom,
    dateTo,
  };
}

export function activeFilterRules(
  rules: TransactionFilterRule[],
): TransactionFilterRule[] {
  return rules.filter((rule) => {
    if (rule.field === "category" && rule.operator === "empty") return true;
    if (rule.field === "hasDossier") return true;
    if (rule.field === "q") return rule.value.trim().length > 0;
    return rule.value.trim().length > 0;
  });
}

export function rulesToLedgerFilters(
  rules: TransactionFilterRule[],
  dateFrom: string,
  dateTo: string,
): LedgerListFilters {
  const filters: LedgerListFilters = {};

  if (dateFrom) filters.dateFrom = dateFrom;
  if (dateTo) filters.dateTo = dateTo;

  for (const rule of activeFilterRules(rules)) {
    switch (rule.field) {
      case "customer":
        if (rule.operator === "eq") filters.customerId = rule.value;
        break;
      case "type":
        if (rule.operator === "eq") filters.transactionTypeId = rule.value;
        break;
      case "side":
        if (rule.operator === "eq") {
          filters.balanceSide = rule.value as BalanceSide;
        }
        break;
      case "entryType":
        if (rule.operator === "eq") {
          filters.entryType = rule.value as LedgerListFilters["entryType"];
        }
        break;
      case "category":
        if (rule.operator === "empty") {
          filters.categoryIsNull = true;
        } else if (rule.operator === "eq") {
          filters.category = rule.value as LedgerListFilters["category"];
        }
        break;
      case "dossier":
        if (rule.operator === "eq") filters.dossierId = rule.value;
        break;
      case "q":
        if (
          (rule.operator === "contains" || rule.operator === "eq") &&
          rule.value.trim()
        ) {
          filters.search = rule.value.trim();
        }
        break;
      case "amountMin":
        if (
          (rule.operator === "gte" || rule.operator === "eq") &&
          rule.value.trim()
        ) {
          filters.amountMin = BigInt(rule.value.trim());
        }
        break;
      case "amountMax":
        if (
          (rule.operator === "lte" || rule.operator === "eq") &&
          rule.value.trim()
        ) {
          filters.amountMax = BigInt(rule.value.trim());
        }
        break;
      case "hasDossier":
        if (rule.operator === "eq") {
          filters.hasDossier = rule.value === "true";
        }
        break;
      default:
        break;
    }
  }

  return filters;
}

export function serializeTransactionsSearchParams(
  state: TransactionsViewState,
): URLSearchParams {
  const sp = new URLSearchParams();

  for (const rule of state.rules) {
    sp.append("f", `${rule.field}:${rule.operator}:${rule.value}`);
  }

  if (state.groupBy.length > 0) {
    sp.set("group", state.groupBy.join(","));
  } else {
    sp.set("group", "none");
  }

  sp.set("sort", state.sort);

  if (state.datePreset !== "all") {
    sp.set("preset", state.datePreset);
  } else {
    if (state.dateFrom) sp.set("from", state.dateFrom);
    if (state.dateTo) sp.set("to", state.dateTo);
  }

  return sp;
}

function isoWeekKey(dateStr: string): { key: string; label: string } {
  const d = new Date(`${dateStr}T12:00:00Z`);
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(
    ((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7,
  );
  const year = d.getUTCFullYear();
  return {
    key: `${year}-W${String(week).padStart(2, "0")}`,
    label: `Semaine ${week} · ${year}`,
  };
}

function monthKey(dateStr: string): { key: string; label: string } {
  const key = dateStr.slice(0, 7);
  const [y, m] = key.split("-").map(Number);
  const label = new Intl.DateTimeFormat("fr-FR", {
    month: "long",
    year: "numeric",
  }).format(new Date(y, m - 1, 1));
  return { key, label: label.charAt(0).toUpperCase() + label.slice(1) };
}

export function getGroupKey(
  row: LedgerEntrySerialized,
  dimension: GroupDimension,
): { key: string; label: string } {
  switch (dimension) {
    case "day":
      return { key: row.effectiveDate, label: row.effectiveDate };
    case "week":
      return isoWeekKey(row.effectiveDate);
    case "month":
      return monthKey(row.effectiveDate);
    case "client":
      return { key: row.customerId, label: row.customerName };
    case "type":
      return {
        key: row.transactionTypeId ?? row.transactionTypeName,
        label: row.transactionTypeName,
      };
    case "side":
      return {
        key: row.balanceSide,
        label: row.balanceSide === "credit" ? "Crédit" : "Débit",
      };
    case "entryType":
      return {
        key: row.entryType,
        label: ENTRY_TYPE_LABELS[row.entryType] ?? row.entryType,
      };
    case "category": {
      const cat = row.category ?? "__none__";
      return {
        key: cat,
        label:
          cat === "__none__"
            ? "Sans catégorie"
            : (CATEGORY_LABELS[cat] ?? cat),
      };
    }
    case "dossier": {
      if (row.dossierId && row.dossierNumber) {
        return { key: row.dossierId, label: row.dossierNumber };
      }
      if (row.allocations.length > 0) {
        const a = row.allocations[0];
        return {
          key: `alloc-${a.dossierId}`,
          label: `${a.dossierNumber} (affectation)`,
        };
      }
      return { key: "__none__", label: "Sans dossier" };
    }
    default:
      return { key: "all", label: "Toutes" };
  }
}

export type LedgerGroupNode = {
  key: string;
  label: string;
  dimension?: GroupDimension;
  children?: LedgerGroupNode[];
  rows?: LedgerEntrySerialized[];
  totalAmount: bigint;
  count: number;
};

function sumRowsAmount(rows: LedgerEntrySerialized[]): bigint {
  let total = BigInt(0);
  for (const row of rows) {
    total +=
      row.balanceSide === "credit"
        ? BigInt(row.amount)
        : -BigInt(row.amount);
  }
  return total;
}

export function buildGroupTree(
  rows: LedgerEntrySerialized[],
  dimensions: GroupDimension[],
): LedgerGroupNode[] {
  if (dimensions.length === 0) {
    return [
      {
        key: "flat",
        label: "Toutes",
        rows,
        totalAmount: sumRowsAmount(rows),
        count: rows.length,
      },
    ];
  }

  const [head, ...tail] = dimensions;
  const buckets = new Map<string, { label: string; rows: LedgerEntrySerialized[] }>();

  for (const row of rows) {
    const { key, label } = getGroupKey(row, head);
    const bucket = buckets.get(key) ?? { label, rows: [] };
    bucket.rows.push(row);
    buckets.set(key, bucket);
  }

  const nodes: LedgerGroupNode[] = [...buckets.entries()].map(
    ([key, bucket]) => {
      const children =
        tail.length > 0
          ? buildGroupTree(bucket.rows, tail)
          : undefined;

      const leafRows = tail.length === 0 ? bucket.rows : undefined;

      return {
        key: `${head}:${key}`,
        label: bucket.label,
        dimension: head,
        children,
        rows: leafRows,
        totalAmount: sumRowsAmount(bucket.rows),
        count: bucket.rows.length,
      };
    },
  );

  nodes.sort((a, b) => b.label.localeCompare(a.label, "fr"));
  return nodes;
}

export function sortLedgerRows(
  rows: LedgerEntrySerialized[],
  sort: TransactionsSort,
): LedgerEntrySerialized[] {
  const copy = [...rows];
  copy.sort((a, b) => {
    switch (sort) {
      case "date-asc": {
        const byDate = a.effectiveDate.localeCompare(b.effectiveDate);
        if (byDate !== 0) return byDate;
        return String(a.createdAt).localeCompare(String(b.createdAt));
      }
      case "amount-desc":
        return Number(BigInt(b.amount) - BigInt(a.amount));
      case "amount-asc":
        return Number(BigInt(a.amount) - BigInt(b.amount));
      case "client-asc":
        return a.customerName.localeCompare(b.customerName, "fr");
      case "client-desc":
        return b.customerName.localeCompare(a.customerName, "fr");
      case "date-desc":
      default: {
        const byDate = b.effectiveDate.localeCompare(a.effectiveDate);
        if (byDate !== 0) return byDate;
        return String(b.createdAt).localeCompare(String(a.createdAt));
      }
    }
  });
  return copy;
}
