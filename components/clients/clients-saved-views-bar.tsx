"use client";

import { useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { OrgListViewsBar } from "@/components/list-views/org-list-views-bar";
import {
  serializeClientsSearchParams,
  type ClientsViewState,
} from "@/lib/modules/customers/clients-query";
import type { OrganizationListViewSerialized } from "@/lib/modules/list-views/serialize";

export function ClientsSavedViewsBar({
  orgViews,
  canManage,
  viewState,
  onApplyQuery,
}: {
  orgViews: OrganizationListViewSerialized[];
  canManage: boolean;
  viewState: ClientsViewState;
  onApplyQuery: (query: string) => void;
}) {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const activeTabKey =
    tabParam?.startsWith("saved:") ? tabParam : "table";

  const saveQuery = useMemo(() => {
    const sp = serializeClientsSearchParams(viewState);
    sp.delete("page");
    return sp.toString();
  }, [viewState]);

  const buildTableQuery = useCallback(() => {
    const sp = serializeClientsSearchParams({
      rules: [],
      groupBy: [],
      sort: "name-asc",
    });
    sp.delete("tab");
    sp.delete("page");
    return sp.toString();
  }, []);

  return (
    <OrgListViewsBar
      pageKey="clients"
      orgViews={orgViews}
      canManage={canManage}
      activeTabKey={activeTabKey}
      onApplyQuery={onApplyQuery}
      getCurrentQuery={() => saveQuery}
      buildTableQuery={buildTableQuery}
      buildZoneQuery={() => ""}
    />
  );
}
