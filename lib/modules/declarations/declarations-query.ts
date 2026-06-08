import { agencyDateRangeForPreset } from "@/lib/modules/ledger/transactions-query";
import {
  newFilterRuleId,
  parseFilterTokens,
  serializeFilterTokens,
} from "@/lib/ui/filter-rules";
import type { DeclarationListFilters } from "./service";
import type { DeclarationListItemSerialized } from "./serialize-list";

export const DECLARATION_VIEW_PRESETS = ["all", "pending", "closed"] as const;
export type DeclarationViewPreset = (typeof DECLARATION_VIEW_PRESETS)[number];

export const DECLARATION_SORT_OPTIONS = [
  "date-desc",
  "date-asc",
  "number-desc",
  "number-asc",
  "amount-desc",
  "amount-asc",
  "gainde-desc",
  "client-asc",
] as const;

export type DeclarationSort = (typeof DECLARATION_SORT_OPTIONS)[number];

export type DeclarationDatePreset =
  | "today"
  | "yesterday"
  | "week"
  | "month"
  | "last30"
  | "all";

export const DECLARATION_FILTER_OPERATORS = [
  "eq",
  "neq",
  "gte",
  "lte",
  "contains",
  "empty",
] as const;

export type DeclarationFilterOperator =
  (typeof DECLARATION_FILTER_OPERATORS)[number];

export const DECLARATION_FILTER_FIELDS = [
  "customer",
  "zone",
  "agency",
  "bonADelivrer",
  "q",
  "amountMin",
  "amountMax",
  "gaindeMin",
  "gaindeMax",
  "costMin",
  "costMax",
  "containerMin",
] as const;

export type DeclarationFilterField =
  (typeof DECLARATION_FILTER_FIELDS)[number];

export type DeclarationFilterRule = {
  id: string;
  field: DeclarationFilterField;
  operator: DeclarationFilterOperator;
  value: string;
};

export const DECLARATION_GROUP_DIMENSIONS = [
  "zone",
  "client",
  "month",
  "agency",
  "bad",
] as const;

export type DeclarationGroupDimension =
  (typeof DECLARATION_GROUP_DIMENSIONS)[number];

/** Active tab: default table, zone ledger, or saved custom view. */
export type DeclarationActiveTab =
  | { kind: "table" }
  | { kind: "zone"; slug: string }
  | { kind: "saved"; id: string };

export type DeclarationsViewState = {
  activeTab: DeclarationActiveTab;
  viewPreset: DeclarationViewPreset;
  rules: DeclarationFilterRule[];
  groupBy: DeclarationGroupDimension[];
  sort: DeclarationSort;
  datePreset: DeclarationDatePreset;
  dateFrom: string;
  dateTo: string;
  /** When true, table footer shows montant / GAINDE / reste totals (zone ledgers). */
  showLedgerTotals: boolean;
};

export const VIEW_PRESET_LABELS: Record<DeclarationViewPreset, string> = {
  all: "Tous",
  pending: "En cours",
  closed: "BAD coché",
};

export const SORT_LABELS: Record<DeclarationSort, string> = {
  "date-desc": "Date (récent)",
  "date-asc": "Date (ancien)",
  "number-desc": "N° décl. (Z→A)",
  "number-asc": "N° décl. (A→Z)",
  "amount-desc": "Montant (décroissant)",
  "amount-asc": "Montant (croissant)",
  "gainde-desc": "GAINDE (décroissant)",
  "client-asc": "Client (A→Z)",
};

export const FILTER_FIELD_LABELS: Record<DeclarationFilterField, string> = {
  customer: "Client",
  zone: "Zone",
  agency: "Maison-mère",
  bonADelivrer: "Bon à délivrer",
  q: "Recherche",
  amountMin: "Montant client min.",
  amountMax: "Montant client max.",
  gaindeMin: "GAINDE min.",
  gaindeMax: "GAINDE max.",
  costMin: "Prix de revient min.",
  costMax: "Prix de revient max.",
  containerMin: "Nb conteneurs min.",
};

export const GROUP_DIMENSION_LABELS: Record<DeclarationGroupDimension, string> =
  {
    zone: "Zone",
    client: "Client",
    month: "Mois",
    agency: "Maison-mère",
    bad: "BAD",
  };

const DATE_PRESETS: DeclarationDatePreset[] = [
  "today",
  "yesterday",
  "week",
  "month",
  "last30",
  "all",
];

function singleParam(
  params: Record<string, string | string[] | undefined>,
  key: string,
): string | undefined {
  const v = params[key];
  if (Array.isArray(v)) return v[0];
  return v;
}

function legacyRulesFromParams(
  params: Record<string, string | undefined>,
): DeclarationFilterRule[] {
  const rules: DeclarationFilterRule[] = [];
  if (params.customer) {
    rules.push({
      id: newFilterRuleId(),
      field: "customer",
      operator: "eq",
      value: params.customer,
    });
  }
  if (params.zone) {
    rules.push({
      id: newFilterRuleId(),
      field: "zone",
      operator: "eq",
      value: params.zone,
    });
  }
  if (params.q) {
    rules.push({
      id: newFilterRuleId(),
      field: "q",
      operator: "contains",
      value: params.q,
    });
  }
  return rules;
}

export function parseDeclarationsViewState(
  params: Record<string, string | string[] | undefined>,
  today: string,
): DeclarationsViewState {
  const viewRaw = singleParam(params, "view") ?? "all";
  const viewPreset = DECLARATION_VIEW_PRESETS.includes(
    viewRaw as DeclarationViewPreset,
  )
    ? (viewRaw as DeclarationViewPreset)
    : "all";

  const sortRaw = singleParam(params, "sort") ?? "date-desc";
  const sort = DECLARATION_SORT_OPTIONS.includes(sortRaw as DeclarationSort)
    ? (sortRaw as DeclarationSort)
    : "date-desc";

  const periodRaw = singleParam(params, "period") ?? "all";
  const datePreset = DATE_PRESETS.includes(periodRaw as DeclarationDatePreset)
    ? (periodRaw as DeclarationDatePreset)
    : "all";

  const explicitFrom = singleParam(params, "from");
  const explicitTo = singleParam(params, "to");

  let dateFrom = explicitFrom ?? "";
  let dateTo = explicitTo ?? "";

  if (!explicitFrom && !explicitTo && datePreset !== "all") {
    const range = agencyDateRangeForPreset(datePreset, today);
    dateFrom = range.dateFrom;
    dateTo = range.dateTo;
  }

  const fParams = params.f;
  const fTokens = Array.isArray(fParams)
    ? fParams
    : fParams
      ? [fParams]
      : [];

  let rules: DeclarationFilterRule[] = parseFilterTokens(
    fTokens,
    DECLARATION_FILTER_FIELDS,
    DECLARATION_FILTER_OPERATORS,
  ).map((r) => ({
    ...r,
    operator: r.operator as DeclarationFilterOperator,
  }));

  if (rules.length === 0) {
    rules = legacyRulesFromParams({
      customer: singleParam(params, "customer"),
      zone: singleParam(params, "zone"),
      q: singleParam(params, "q"),
    });
  }

  const groupRaw = singleParam(params, "group");
  const groupBy: DeclarationGroupDimension[] =
    groupRaw && groupRaw !== "none"
      ? groupRaw
          .split(",")
          .filter((d): d is DeclarationGroupDimension =>
            (DECLARATION_GROUP_DIMENSIONS as readonly string[]).includes(d),
          )
      : [];

  const tabRaw = singleParam(params, "tab");
  let activeTab: DeclarationActiveTab = { kind: "table" };
  let showLedgerTotals = singleParam(params, "ledger") === "1";

  if (tabRaw?.startsWith("zone:")) {
    const slug = tabRaw.slice("zone:".length).trim().toUpperCase();
    if (slug) {
      activeTab = { kind: "zone", slug };
      showLedgerTotals = true;
      if (!rules.some((r) => r.field === "zone" && r.operator === "eq")) {
        rules = [
          ...rules,
          {
            id: newFilterRuleId(),
            field: "zone",
            operator: "eq",
            value: slug,
          },
        ];
      }
    }
  } else if (tabRaw?.startsWith("saved:")) {
    const id = tabRaw.slice("saved:".length);
    if (id) activeTab = { kind: "saved", id };
  }

  return {
    activeTab,
    viewPreset,
    rules,
    groupBy,
    sort,
    datePreset: explicitFrom || explicitTo ? "all" : datePreset,
    dateFrom,
    dateTo,
    showLedgerTotals,
  };
}

export function activeDeclarationFilterRules(
  rules: DeclarationFilterRule[],
): DeclarationFilterRule[] {
  return rules.filter(
    (r) =>
      r.operator === "empty" ||
      r.value.trim() !== "" ||
      r.field === "bonADelivrer",
  );
}

export function viewStateToListFilters(
  state: DeclarationsViewState,
): DeclarationListFilters {
  const filters: DeclarationListFilters = {};

  if (state.viewPreset === "pending") {
    filters.bonADelivrer = false;
  } else if (state.viewPreset === "closed") {
    filters.bonADelivrer = true;
  }

  for (const rule of activeDeclarationFilterRules(state.rules)) {
    switch (rule.field) {
      case "customer":
        if (rule.operator === "eq" && rule.value) {
          filters.customerId = rule.value;
        }
        break;
      case "zone":
        if (rule.operator === "eq" && rule.value) {
          filters.zoneOrTerminal = rule.value.toUpperCase();
        }
        break;
      case "agency":
        if (rule.operator === "eq" && rule.value) {
          filters.payingAgencyId = rule.value;
        }
        break;
      case "bonADelivrer":
        if (rule.operator === "eq") {
          filters.bonADelivrer = rule.value === "true";
        }
        break;
      case "q":
        if (rule.operator === "contains" && rule.value.trim()) {
          filters.search = rule.value.trim();
        }
        break;
      default:
        break;
    }
  }

  if (state.dateFrom) filters.dateFrom = state.dateFrom;
  if (state.dateTo) filters.dateTo = state.dateTo;

  return filters;
}

function bigintOrNull(value: string | null): bigint | null {
  if (value == null) return null;
  try {
    return BigInt(value);
  } catch {
    return null;
  }
}

/** Client-side filters (amounts, etc.) applied after server fetch. */
export function applyDeclarationClientFilters(
  rows: DeclarationListItemSerialized[],
  rules: DeclarationFilterRule[],
): DeclarationListItemSerialized[] {
  const active = activeDeclarationFilterRules(rules);

  return rows.filter((row) => {
    for (const rule of active) {
      switch (rule.field) {
        case "amountMin": {
          const min = bigintOrNull(rule.value);
          const amt = bigintOrNull(row.clientAmountPaid);
          if (min != null && (amt == null || amt < min)) return false;
          break;
        }
        case "amountMax": {
          const max = bigintOrNull(rule.value);
          const amt = bigintOrNull(row.clientAmountPaid);
          if (max != null && (amt == null || amt > max)) return false;
          break;
        }
        case "gaindeMin": {
          const min = bigintOrNull(rule.value);
          const amt = bigintOrNull(row.gaindeDutyAmount);
          if (min != null && (amt == null || amt < min)) return false;
          break;
        }
        case "gaindeMax": {
          const max = bigintOrNull(rule.value);
          const amt = bigintOrNull(row.gaindeDutyAmount);
          if (max != null && (amt == null || amt > max)) return false;
          break;
        }
        case "costMin": {
          const min = bigintOrNull(rule.value);
          const amt = bigintOrNull(row.costPrice);
          if (min != null && (amt == null || amt < min)) return false;
          break;
        }
        case "costMax": {
          const max = bigintOrNull(rule.value);
          const amt = bigintOrNull(row.costPrice);
          if (max != null && (amt == null || amt > max)) return false;
          break;
        }
        case "containerMin": {
          const min = Number(rule.value);
          const count = row.containerCount ?? 0;
          if (!Number.isNaN(min) && count < min) return false;
          break;
        }
        case "agency":
          if (rule.operator === "eq" && rule.value) {
            if (row.payingAgencyId !== rule.value) return false;
          }
          break;
        case "bonADelivrer":
          if (rule.operator === "eq") {
            const want = rule.value === "true";
            if (row.bonADelivrer !== want) return false;
          }
          break;
        case "zone":
          if (rule.operator === "eq" && rule.value) {
            const z = (row.zoneOrTerminal ?? "").toUpperCase();
            if (z !== rule.value.toUpperCase()) return false;
          }
          break;
        default:
          break;
      }
    }
    return true;
  });
}

export function serializeDeclarationsSearchParams(
  state: DeclarationsViewState,
): URLSearchParams {
  const sp = new URLSearchParams();

  if (state.activeTab.kind === "zone") {
    sp.set("tab", `zone:${state.activeTab.slug}`);
    sp.set("ledger", "1");
  } else if (state.activeTab.kind === "saved") {
    sp.set("tab", `saved:${state.activeTab.id}`);
  }

  if (state.viewPreset !== "all") sp.set("view", state.viewPreset);
  if (state.sort !== "date-desc") sp.set("sort", state.sort);
  if (state.datePreset !== "all") sp.set("period", state.datePreset);
  if (state.dateFrom) sp.set("from", state.dateFrom);
  if (state.dateTo) sp.set("to", state.dateTo);

  for (const token of serializeFilterTokens(state.rules)) {
    sp.append("f", token);
  }

  if (state.groupBy.length > 0) {
    sp.set("group", state.groupBy.join(","));
  } else {
    sp.set("group", "none");
  }

  if (state.showLedgerTotals && state.activeTab.kind !== "zone") {
    sp.set("ledger", "1");
  }

  return sp;
}

export function formatDeclarationsFilterSummary(
  state: DeclarationsViewState,
  totalCount?: number,
): string {
  const parts: string[] = [];

  if (state.activeTab.kind === "zone") {
    parts.push(`Grand livre zone ${state.activeTab.slug}`);
  } else if (state.activeTab.kind === "saved") {
    parts.push("Vue enregistrée");
  } else {
    parts.push(VIEW_PRESET_LABELS[state.viewPreset]);
  }

  const activeRules = activeDeclarationFilterRules(state.rules);
  if (activeRules.length > 0) {
    parts.push(
      `${activeRules.length} filtre${activeRules.length > 1 ? "s" : ""}`,
    );
  }

  if (state.dateFrom || state.dateTo) {
    if (state.dateFrom && state.dateTo) {
      parts.push(`${state.dateFrom} → ${state.dateTo}`);
    } else if (state.dateFrom) {
      parts.push(`À partir du ${state.dateFrom}`);
    } else {
      parts.push(`Jusqu'au ${state.dateTo}`);
    }
  } else if (state.datePreset !== "all") {
    const periodLabels: Record<DeclarationDatePreset, string> = {
      today: "Aujourd'hui",
      yesterday: "Hier",
      week: "Cette semaine",
      month: "Ce mois",
      last30: "30 jours",
      all: "Toutes dates",
    };
    parts.push(periodLabels[state.datePreset]);
  }

  if (state.groupBy.length > 0) {
    parts.push(
      `Regroupement : ${state.groupBy.map((d) => GROUP_DIMENSION_LABELS[d]).join(" › ")}`,
    );
  }

  parts.push(`Tri : ${SORT_LABELS[state.sort]}`);

  if (totalCount != null) {
    parts.push(
      `${totalCount} déclaration${totalCount === 1 ? "" : "s"}`,
    );
  }

  return parts.join(" · ");
}

export function viewHasCustomizations(state: DeclarationsViewState): boolean {
  return (
    state.activeTab.kind !== "table" ||
    state.viewPreset !== "all" ||
    state.sort !== "date-desc" ||
    state.datePreset !== "all" ||
    Boolean(state.dateFrom || state.dateTo) ||
    state.rules.length > 0 ||
    state.groupBy.length > 0
  );
}

export function sortDeclarationRows(
  rows: DeclarationListItemSerialized[],
  sort: DeclarationSort,
): DeclarationListItemSerialized[] {
  const copy = [...rows];

  copy.sort((a, b) => {
    switch (sort) {
      case "date-asc": {
        const da = a.declarationDate ?? "";
        const db = b.declarationDate ?? "";
        return (
          da.localeCompare(db) ||
          a.declarationNumber.localeCompare(b.declarationNumber)
        );
      }
      case "number-desc":
        return b.declarationNumber.localeCompare(a.declarationNumber);
      case "number-asc":
        return a.declarationNumber.localeCompare(b.declarationNumber);
      case "amount-desc":
      case "amount-asc": {
        const aa = BigInt(a.clientAmountPaid ?? "0");
        const ab = BigInt(b.clientAmountPaid ?? "0");
        return Number(
          sort === "amount-desc" ? ab - aa : aa - ab,
        );
      }
      case "gainde-desc": {
        const aa = BigInt(a.gaindeDutyAmount ?? "0");
        const ab = BigInt(b.gaindeDutyAmount ?? "0");
        return ab > aa ? 1 : ab < aa ? -1 : 0;
      }
      case "client-asc":
        return a.customerName.localeCompare(b.customerName, "fr");
      case "date-desc":
      default: {
        const da = a.declarationDate ?? "";
        const db = b.declarationDate ?? "";
        return (
          db.localeCompare(da) ||
          b.declarationNumber.localeCompare(a.declarationNumber)
        );
      }
    }
  });

  return copy;
}

export type DeclarationLedgerTotals = {
  clientAmountPaid: bigint;
  gaindeDutyAmount: bigint;
  reste: bigint;
  rowCount: number;
};

export function sumDeclarationLedgerTotals(
  rows: DeclarationListItemSerialized[],
): DeclarationLedgerTotals {
  let clientAmountPaid = BigInt(0);
  let gaindeDutyAmount = BigInt(0);
  let reste = BigInt(0);

  for (const row of rows) {
    if (row.clientAmountPaid) {
      clientAmountPaid += BigInt(row.clientAmountPaid);
    }
    if (row.gaindeDutyAmount) {
      gaindeDutyAmount += BigInt(row.gaindeDutyAmount);
    }
    const paid = row.clientAmountPaid ? BigInt(row.clientAmountPaid) : null;
    const cost = row.costPrice ? BigInt(row.costPrice) : null;
    if (paid != null && cost != null) {
      reste += paid - cost;
    }
  }

  return { clientAmountPaid, gaindeDutyAmount, reste, rowCount: rows.length };
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

export function getDeclarationGroupKey(
  row: DeclarationListItemSerialized,
  dimension: DeclarationGroupDimension,
): { key: string; label: string } {
  switch (dimension) {
    case "zone":
      return {
        key: row.zoneOrTerminal ?? "__none__",
        label: row.zoneOrTerminal ?? "Sans zone",
      };
    case "client":
      return { key: row.customerSlug, label: row.customerName };
    case "month":
      if (!row.declarationDate) {
        return { key: "__none__", label: "Sans date" };
      }
      return monthKey(row.declarationDate);
    case "agency":
      return {
        key: row.payingAgencyName ?? "__none__",
        label: row.payingAgencyName ?? "Sans maison-mère",
      };
    case "bad":
      return {
        key: row.bonADelivrer ? "yes" : "no",
        label: row.bonADelivrer ? "BAD coché" : "En cours",
      };
    default:
      return { key: "all", label: "Toutes" };
  }
}

export type DeclarationGroupNode = {
  key: string;
  label: string;
  dimension?: DeclarationGroupDimension;
  children?: DeclarationGroupNode[];
  rows?: DeclarationListItemSerialized[];
  totals: DeclarationLedgerTotals;
  count: number;
};

export function buildDeclarationGroupTree(
  rows: DeclarationListItemSerialized[],
  dimensions: DeclarationGroupDimension[],
): DeclarationGroupNode[] {
  if (dimensions.length === 0) {
    return [
      {
        key: "flat",
        label: "Toutes",
        rows,
        totals: sumDeclarationLedgerTotals(rows),
        count: rows.length,
      },
    ];
  }

  const [head, ...tail] = dimensions;
  const buckets = new Map<
    string,
    { label: string; rows: DeclarationListItemSerialized[] }
  >();

  for (const row of rows) {
    const { key, label } = getDeclarationGroupKey(row, head);
    const bucket = buckets.get(key) ?? { label, rows: [] };
    bucket.rows.push(row);
    buckets.set(key, bucket);
  }

  return [...buckets.entries()]
    .map(([key, bucket]) => {
      const children =
        tail.length > 0 ? buildDeclarationGroupTree(bucket.rows, tail) : undefined;
      const leafRows = tail.length === 0 ? bucket.rows : undefined;

      return {
        key: `${head}:${key}`,
        label: bucket.label,
        dimension: head,
        children,
        rows: leafRows,
        totals: sumDeclarationLedgerTotals(bucket.rows),
        count: bucket.rows.length,
      };
    })
    .sort((a, b) => a.label.localeCompare(b.label, "fr"));
}
