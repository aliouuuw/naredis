"use client";

import { useCallback, useMemo } from "react";
import { OrgListViewsBar } from "@/components/list-views/org-list-views-bar";
import {
  serializeDeclarationsSearchParams,
  type DeclarationsViewState,
} from "@/lib/modules/declarations/declarations-query";
import type { OrganizationListViewSerialized } from "@/lib/modules/list-views/serialize";

export function DeclarationSavedViewsBar({
  orgViews,
  canManage,
  viewState,
  zoneSlugs,
  onApplyQuery,
}: {
  orgViews: OrganizationListViewSerialized[];
  canManage: boolean;
  viewState: DeclarationsViewState;
  zoneSlugs: string[];
  onApplyQuery: (query: string) => void;
}) {
  const activeTabKey =
    viewState.activeTab.kind === "table"
      ? "table"
      : viewState.activeTab.kind === "zone"
        ? `zone:${viewState.activeTab.slug}`
        : `saved:${viewState.activeTab.id}`;

  const buildTableQuery = useCallback(() => {
    const sp = serializeDeclarationsSearchParams({
      ...viewState,
      activeTab: { kind: "table" },
      showLedgerTotals: false,
    });
    sp.delete("tab");
    sp.delete("ledger");
    sp.delete("page");
    sp.delete("open");
    return sp.toString();
  }, [viewState]);

  const buildZoneQuery = useCallback((slug: string) => {
    const sp = serializeDeclarationsSearchParams({
      activeTab: { kind: "zone", slug },
      viewPreset: "all",
      rules: [
        {
          id: "zone-tab",
          field: "zone",
          operator: "eq",
          value: slug,
        },
      ],
      groupBy: [],
      sort: "date-desc",
      datePreset: "all",
      dateFrom: "",
      dateTo: "",
      showLedgerTotals: true,
    });
    sp.delete("page");
    sp.delete("open");
    return sp.toString();
  }, []);

  const saveQuery = useMemo(() => {
    const sp = serializeDeclarationsSearchParams(viewState);
    sp.delete("page");
    sp.delete("open");
    return sp.toString();
  }, [viewState]);

  return (
    <OrgListViewsBar
      pageKey="declarations"
      orgViews={orgViews}
      canManage={canManage}
      activeTabKey={activeTabKey}
      zoneSlugs={zoneSlugs}
      onApplyQuery={onApplyQuery}
      getCurrentQuery={() => saveQuery}
      buildTableQuery={buildTableQuery}
      buildZoneQuery={buildZoneQuery}
    />
  );
}
