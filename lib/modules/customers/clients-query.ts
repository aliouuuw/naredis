import type { CustomerListItemSerialized } from "./serialize-list";

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

export type ClientsViewState = {
  search: string;
  sort: ClientSort;
  accountStatus: ClientAccountStatusFilter;
};

export const CLIENT_SORT_LABELS: Record<ClientSort, string> = {
  "name-asc": "Nom (A→Z)",
  "name-desc": "Nom (Z→A)",
  "balance-desc": "Solde (décroissant)",
  "balance-asc": "Solde (croissant)",
  "fees-desc": "Frais dossiers (décroissant)",
  status: "Statut compte",
};

export function parseClientsViewState(
  params: Record<string, string | string[] | undefined>,
): ClientsViewState {
  const single = (key: string): string | undefined => {
    const v = params[key];
    if (Array.isArray(v)) return v[0];
    return v;
  };

  const sortRaw = single("sort") ?? "name-asc";
  const sort = CLIENT_SORT_OPTIONS.includes(sortRaw as ClientSort)
    ? (sortRaw as ClientSort)
    : "name-asc";

  const statusRaw = single("status") ?? "";
  const accountStatus: ClientAccountStatusFilter =
    statusRaw === "a_jour" || statusRaw === "pas_a_jour" ? statusRaw : "";

  return {
    search: single("q") ?? "",
    sort,
    accountStatus,
  };
}

export function serializeClientsSearchParams(state: ClientsViewState): URLSearchParams {
  const sp = new URLSearchParams();
  if (state.sort !== "name-asc") sp.set("sort", state.sort);
  if (state.accountStatus) sp.set("status", state.accountStatus);
  if (state.search.trim()) sp.set("q", state.search.trim());
  return sp;
}

export function viewHasCustomizations(state: ClientsViewState): boolean {
  return (
    state.sort !== "name-asc" ||
    Boolean(state.accountStatus) ||
    Boolean(state.search.trim())
  );
}

export function filterAndSortClients(
  rows: CustomerListItemSerialized[],
  state: ClientsViewState,
): CustomerListItemSerialized[] {
  const q = state.search.trim().toLowerCase();
  let copy = rows.filter((row) => {
    if (state.accountStatus && row.accountStatus !== state.accountStatus) {
      return false;
    }
    if (!q) return true;
    const haystack = [row.name, row.slug, row.phone ?? ""]
      .join(" ")
      .toLowerCase();
    return haystack.includes(q);
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
