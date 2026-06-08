import type { OrganizationListViewRow } from "./service";

export type OrganizationListViewSerialized = {
  id: string;
  name: string;
  query: string;
  sortOrder: number;
};

export function serializeOrganizationListView(
  row: OrganizationListViewRow,
): OrganizationListViewSerialized {
  return {
    id: row.id,
    name: row.name,
    query: row.query,
    sortOrder: row.sortOrder,
  };
}
