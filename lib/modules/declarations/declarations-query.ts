import { agencyDateRangeForPreset } from "@/lib/modules/ledger/transactions-query";
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

export type DeclarationsViewState = {
  viewPreset: DeclarationViewPreset;
  sort: DeclarationSort;
  datePreset: DeclarationDatePreset;
  dateFrom: string;
  dateTo: string;
  customerId: string;
  zone: string;
  search: string;
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
  "client-asc": "Client (A→Z)",
};

const DATE_PRESETS: DeclarationDatePreset[] = [
  "today",
  "yesterday",
  "week",
  "month",
  "last30",
  "all",
];

export function parseDeclarationsViewState(
  params: Record<string, string | string[] | undefined>,
  today: string,
): DeclarationsViewState {
  const single = (key: string): string | undefined => {
    const v = params[key];
    if (Array.isArray(v)) return v[0];
    return v;
  };

  const viewRaw = single("view") ?? "all";
  const viewPreset = DECLARATION_VIEW_PRESETS.includes(
    viewRaw as DeclarationViewPreset,
  )
    ? (viewRaw as DeclarationViewPreset)
    : "all";

  const sortRaw = single("sort") ?? "date-desc";
  const sort = DECLARATION_SORT_OPTIONS.includes(sortRaw as DeclarationSort)
    ? (sortRaw as DeclarationSort)
    : "date-desc";

  const periodRaw = single("period") ?? "all";
  const datePreset = DATE_PRESETS.includes(periodRaw as DeclarationDatePreset)
    ? (periodRaw as DeclarationDatePreset)
    : "all";

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
    viewPreset,
    sort,
    datePreset: explicitFrom || explicitTo ? "all" : datePreset,
    dateFrom,
    dateTo,
    customerId: single("customer") ?? "",
    zone: single("zone") ?? "",
    search: single("q") ?? "",
  };
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

  if (state.customerId) filters.customerId = state.customerId;
  if (state.zone) filters.zoneOrTerminal = state.zone;
  if (state.search.trim()) filters.search = state.search.trim();
  if (state.dateFrom) filters.dateFrom = state.dateFrom;
  if (state.dateTo) filters.dateTo = state.dateTo;

  return filters;
}

export function serializeDeclarationsSearchParams(
  state: DeclarationsViewState,
): URLSearchParams {
  const sp = new URLSearchParams();

  if (state.viewPreset !== "all") sp.set("view", state.viewPreset);
  if (state.sort !== "date-desc") sp.set("sort", state.sort);
  if (state.datePreset !== "all") sp.set("period", state.datePreset);
  if (state.dateFrom) sp.set("from", state.dateFrom);
  if (state.dateTo) sp.set("to", state.dateTo);
  if (state.customerId) sp.set("customer", state.customerId);
  if (state.zone) sp.set("zone", state.zone);
  if (state.search.trim()) sp.set("q", state.search.trim());

  return sp;
}

export function viewHasCustomizations(state: DeclarationsViewState): boolean {
  return (
    state.viewPreset !== "all" ||
    state.sort !== "date-desc" ||
    state.datePreset !== "all" ||
    Boolean(state.dateFrom || state.dateTo) ||
    Boolean(state.customerId || state.zone || state.search.trim())
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
        return da.localeCompare(db) || a.declarationNumber.localeCompare(b.declarationNumber);
      }
      case "number-desc":
        return b.declarationNumber.localeCompare(a.declarationNumber);
      case "number-asc":
        return a.declarationNumber.localeCompare(b.declarationNumber);
      case "amount-desc": {
        const aa = BigInt(a.clientAmountPaid ?? "0");
        const ab = BigInt(b.clientAmountPaid ?? "0");
        return ab > aa ? 1 : ab < aa ? -1 : 0;
      }
      case "client-asc":
        return a.customerName.localeCompare(b.customerName, "fr");
      case "date-desc":
      default: {
        const da = a.declarationDate ?? "";
        const db = b.declarationDate ?? "";
        return db.localeCompare(da) || b.declarationNumber.localeCompare(a.declarationNumber);
      }
    }
  });

  return copy;
}
