"use client";

import { useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { OrgListViewsBar } from "@/components/list-views/org-list-views-bar";
import {
  serializeTransactionsSearchParams,
  type TransactionsViewState,
} from "@/lib/modules/ledger/transactions-query";
import type { OrganizationListViewSerialized } from "@/lib/modules/list-views/serialize";

export function TransactionsSavedViewsBar({
  orgViews,
  canManage,
  viewState,
  onApplyQuery,
}: {
  orgViews: OrganizationListViewSerialized[];
  canManage: boolean;
  viewState: TransactionsViewState;
  onApplyQuery: (query: string) => void;
}) {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const activeTabKey =
    tabParam?.startsWith("saved:") ? tabParam : "table";

  const saveQuery = useMemo(() => {
    const sp = serializeTransactionsSearchParams(viewState);
    sp.delete("page");
    sp.delete("record");
    return sp.toString();
  }, [viewState]);

  const buildTableQuery = useCallback(() => {
    const sp = serializeTransactionsSearchParams({
      rules: [],
      groupBy: ["day"],
      sort: "date-desc",
      datePreset: "today",
      dateFrom: "",
      dateTo: "",
    });
    sp.delete("tab");
    sp.delete("page");
    return sp.toString();
  }, []);

  return (
    <OrgListViewsBar
      pageKey="transactions"
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
