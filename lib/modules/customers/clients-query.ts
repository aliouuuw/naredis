import type { CustomerListItemSerialized } from "./serialize-list";
import {
  newFilterRuleId,
  parseFilterTokens,
  serializeFilterTokens,
} from "@/lib/ui/filter-rules";

export const CLIENT_SORT_OPTIONS = [
  "name-asc",
  "name-desc",
  "balance-desc",
  "balance-asc",
  "fees-desc",
  "status",
] as const;

export type ClientSort = (typeof CLIENT_SORT_OPTIONS)[number];

export type ClientAccountStatusFilter = "" | "a_jour" | "pas_a_jour";

export const CLIENT_FILTER_OPERATORS = [
  "eq",
  "neq",
  "gte",
  "lte",
  "contains",
] as const;

export type ClientFilterOperator = (typeof CLIENT_FILTER_OPERATORS)[number];

export const CLIENT_FILTER_FIELDS = [
  "q",
  "accountStatus",
  "balanceMin",
  "balanceMax",
  "feesMin",
  "feesMax",
  "txTodayMin",
] as const;

export type ClientFilterField = (typeof CLIENT_FILTER_FIELDS)[number];

export type ClientFilterRule = {
  id: string;
  field: ClientFilterField;
  operator: ClientFilterOperator;
  value: string;
};

export const CLIENT_GROUP_DIMENSIONS = ["status", "balanceSide"] as const;
export type ClientGroupDimension = (typeof CLIENT_GROUP_DIMENSIONS)[number];

export type ClientsViewState = {
  rules: ClientFilterRule[];
  groupBy: ClientGroupDimension[];
  sort: ClientSort;
};

export const CLIENT_SORT_LABELS: Record<ClientSort, string> = {
  "name-asc": "Nom (A→Z)",
  "name-desc": "Nom (Z→A)",
  "balance-desc": "Solde (décroissant)",
  "balance-asc": "Solde (croissant)",
  "fees-desc": "Frais dossiers (décroissant)",
  status: "Statut compte",
};

export const CLIENT_FILTER_FIELD_LABELS: Record<ClientFilterField, string> = {
  q: "Recherche",
  accountStatus: "Statut compte",
  balanceMin: "Solde min.",
  balanceMax: "Solde max.",
  feesMin: "Frais min.",
  feesMax: "Frais max.",
  txTodayMin: "Transactions jour min.",
};

export const CLIENT_GROUP_LABELS: Record<ClientGroupDimension, string> = {
  status: "Statut",
  balanceSide: "Sens du solde",
};

function singleParam(
  params: Record<string, string | string[] | undefined>,
  key: string,
): string | undefined {
  const v = params[key];
  if (Array.isArray(v)) return v[0];
  return v;
}

function legacyRules(params: Record<string, string | undefined>): ClientFilterRule[] {
  const rules: ClientFilterRule[] = [];
  if (params.q) {
    rules.push({
      id: newFilterRuleId(),
      field: "q",
      operator: "contains",
      value: params.q,
    });
  }
  if (params.status === "a_jour" || params.status === "pas_a_jour") {
    rules.push({
      id: newFilterRuleId(),
      field: "accountStatus",
      operator: "eq",
      value: params.status,
    });
  }
  return rules;
}

export function parseClientsViewState(
  params: Record<string, string | string[] | undefined>,
): ClientsViewState {
  const sortRaw = singleParam(params, "sort") ?? "name-asc";
  const sort = CLIENT_SORT_OPTIONS.includes(sortRaw as ClientSort)
    ? (sortRaw as ClientSort)
    : "name-asc";

  const fParams = params.f;
  const fTokens = Array.isArray(fParams)
    ? fParams
    : fParams
      ? [fParams]
      : [];

  let rules: ClientFilterRule[] = parseFilterTokens(
    fTokens,
    CLIENT_FILTER_FIELDS,
    CLIENT_FILTER_OPERATORS,
  ).map((r) => ({
    ...r,
    operator: r.operator as ClientFilterOperator,
  }));

  if (rules.length === 0) {
    rules = legacyRules({
      q: singleParam(params, "q"),
      status: singleParam(params, "status"),
    });
  }

  const groupRaw = singleParam(params, "group");
  const groupBy: ClientGroupDimension[] =
    groupRaw && groupRaw !== "none"
      ? groupRaw
          .split(",")
          .filter((d): d is ClientGroupDimension =>
            (CLIENT_GROUP_DIMENSIONS as readonly string[]).includes(d),
          )
      : [];

  return { rules, groupBy, sort };
}

export function activeClientFilterRules(rules: ClientFilterRule[]): ClientFilterRule[] {
  return rules.filter((r) => r.value.trim() !== "");
}

export function serializeClientsSearchParams(state: ClientsViewState): URLSearchParams {
  const sp = new URLSearchParams();
  if (state.sort !== "name-asc") sp.set("sort", state.sort);
  for (const token of serializeFilterTokens(state.rules)) {
    sp.append("f", token);
  }
  if (state.groupBy.length > 0) {
    sp.set("group", state.groupBy.join(","));
  } else {
    sp.set("group", "none");
  }
  return sp;
}

export function viewHasCustomizations(state: ClientsViewState): boolean {
  return (
    state.sort !== "name-asc" ||
    state.rules.length > 0 ||
    state.groupBy.length > 0
  );
}

export function formatClientsFilterSummary(
  state: ClientsViewState,
  totalCount: number,
): string {
  const parts: string[] = [];
  const active = activeClientFilterRules(state.rules);
  if (active.length > 0) {
    parts.push(`${active.length} filtre${active.length > 1 ? "s" : ""}`);
  }
  if (state.groupBy.length > 0) {
    parts.push(
      `Regroupement : ${state.groupBy.map((d) => CLIENT_GROUP_LABELS[d]).join(" › ")}`,
    );
  } else {
    parts.push("Liste plate");
  }
  parts.push(`Tri : ${CLIENT_SORT_LABELS[state.sort]}`);
  parts.push(`${totalCount} client${totalCount === 1 ? "" : "s"}`);
  return parts.join(" · ");
}

function bigintOrNull(value: string): bigint | null {
  try {
    return BigInt(value.trim());
  } catch {
    return null;
  }
}

export function filterAndSortClients(
  rows: CustomerListItemSerialized[],
  state: ClientsViewState,
): CustomerListItemSerialized[] {
  const active = activeClientFilterRules(state.rules);

  let copy = rows.filter((row) => {
    for (const rule of active) {
      switch (rule.field) {
        case "q": {
          const q = rule.value.trim().toLowerCase();
          if (!q) break;
          const haystack = [row.name, row.slug, row.phone ?? ""]
            .join(" ")
            .toLowerCase();
          if (!haystack.includes(q)) return false;
          break;
        }
        case "accountStatus":
          if (rule.operator === "eq" && row.accountStatus !== rule.value) {
            return false;
          }
          break;
        case "balanceMin": {
          const min = bigintOrNull(rule.value);
          if (min != null && BigInt(row.balanceAmount) < min) return false;
          break;
        }
        case "balanceMax": {
          const max = bigintOrNull(rule.value);
          if (max != null && BigInt(row.balanceAmount) > max) return false;
          break;
        }
        case "feesMin": {
          const min = bigintOrNull(rule.value);
          if (min != null && BigInt(row.feesAllTime) < min) return false;
          break;
        }
        case "feesMax": {
          const max = bigintOrNull(rule.value);
          if (max != null && BigInt(row.feesAllTime) > max) return false;
          break;
        }
        case "txTodayMin": {
          const min = bigintOrNull(rule.value);
          if (min != null && BigInt(row.transactionsToday) < min) return false;
          break;
        }
        default:
          break;
      }
    }
    return true;
  });

  copy = [...copy];
  copy.sort((a, b) => {
    switch (state.sort) {
      case "name-desc":
        return b.name.localeCompare(a.name, "fr");
      case "balance-desc": {
        const aa = BigInt(a.balanceAmount);
        const ab = BigInt(b.balanceAmount);
        return ab > aa ? 1 : ab < aa ? -1 : 0;
      }
      case "balance-asc": {
        const aa = BigInt(a.balanceAmount);
        const ab = BigInt(b.balanceAmount);
        return aa > ab ? 1 : aa < ab ? -1 : 0;
      }
      case "fees-desc": {
        const aa = BigInt(a.feesAllTime);
        const ab = BigInt(b.feesAllTime);
        return ab > aa ? 1 : ab < aa ? -1 : 0;
      }
      case "status": {
        const order = { pas_a_jour: 0, a_jour: 1 } as const;
        const cmp = order[a.accountStatus] - order[b.accountStatus];
        return cmp !== 0 ? cmp : a.name.localeCompare(b.name, "fr");
      }
      case "name-asc":
      default:
        return a.name.localeCompare(b.name, "fr");
    }
  });

  return copy;
}

export type ClientGroupNode = {
  key: string;
  label: string;
  rows: CustomerListItemSerialized[];
  count: number;
  children?: ClientGroupNode[];
};

function clientGroupKey(
  row: CustomerListItemSerialized,
  dim: ClientGroupDimension,
): { key: string; label: string } {
  if (dim === "status") {
    return {
      key: row.accountStatus,
      label: row.accountStatus === "a_jour" ? "À jour" : "Pas à jour",
    };
  }
  return {
    key: row.balanceSide,
    label: row.balanceSide === "credit" ? "Crédit" : "Débit",
  };
}

export function buildClientGroupTree(
  rows: CustomerListItemSerialized[],
  dimensions: ClientGroupDimension[],
): ClientGroupNode[] {
  if (dimensions.length === 0) {
    return [{ key: "flat", label: "Tous", rows, count: rows.length }];
  }

  const [head, ...tail] = dimensions;
  const buckets = new Map<string, { label: string; rows: CustomerListItemSerialized[] }>();

  for (const row of rows) {
    const { key, label } = clientGroupKey(row, head);
    const bucket = buckets.get(key) ?? { label, rows: [] };
    bucket.rows.push(row);
    buckets.set(key, bucket);
  }

  return [...buckets.entries()].map(([key, bucket]) => ({
    key: `${head}:${key}`,
    label: bucket.label,
    rows: tail.length === 0 ? bucket.rows : [],
    count: bucket.rows.length,
    children:
      tail.length > 0 ? buildClientGroupTree(bucket.rows, tail) : undefined,
  }));
}
