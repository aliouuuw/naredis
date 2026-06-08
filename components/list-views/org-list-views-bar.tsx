"use client";

import { useCallback, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Trash2, Users } from "lucide-react";
import {
  createOrgListViewAction,
  deleteOrgListViewAction,
} from "@/lib/actions/list-views";
import type { ListViewPageKey } from "@/lib/modules/list-views/schemas";
import type { OrganizationListViewSerialized } from "@/lib/modules/list-views/serialize";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export function OrgListViewsBar({
  pageKey,
  orgViews,
  canManage,
  activeTabKey,
  zoneSlugs = [],
  onApplyQuery,
  getCurrentQuery,
  buildTableQuery,
  buildZoneQuery,
}: {
  pageKey: ListViewPageKey;
  orgViews: OrganizationListViewSerialized[];
  canManage: boolean;
  activeTabKey: string;
  zoneSlugs?: string[];
  onApplyQuery: (query: string) => void;
  getCurrentQuery: () => string;
  buildTableQuery: () => string;
  buildZoneQuery: (slug: string) => string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const applyTab = useCallback(
    (tab: string) => {
      setError(null);
      if (tab === "table") {
        onApplyQuery(buildTableQuery());
        return;
      }
      if (tab.startsWith("zone:")) {
        onApplyQuery(buildZoneQuery(tab.slice("zone:".length)));
        return;
      }
      if (tab.startsWith("saved:")) {
        const id = tab.slice("saved:".length);
        const view = orgViews.find((v) => v.id === id);
        if (view) {
          const sp = new URLSearchParams(view.query);
          sp.set("tab", `saved:${id}`);
          sp.delete("page");
          sp.delete("open");
          onApplyQuery(sp.toString());
        }
      }
    },
    [buildTableQuery, buildZoneQuery, onApplyQuery, orgViews],
  );

  function saveForEveryone() {
    const name = window.prompt("Nom de la vue pour toute l'équipe");
    if (!name?.trim()) return;

    const query = getCurrentQuery();
    startTransition(async () => {
      setError(null);
      const result = await createOrgListViewAction({
        pageKey,
        name: name.trim(),
        query,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
      if (result.data) {
        applyTab(`saved:${result.data.id}`);
      }
    });
  }

  function deleteView(viewId: string, viewName: string) {
    if (
      !window.confirm(
        `Supprimer la vue « ${viewName} » pour toute l'organisation ?`,
      )
    ) {
      return;
    }

    startTransition(async () => {
      setError(null);
      const result = await deleteOrgListViewAction({ viewId, pageKey });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      if (activeTabKey === `saved:${viewId}`) {
        applyTab("table");
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-1">
      <div className="flex flex-wrap items-center gap-1 border-b pb-2">
        <TabButton
          active={activeTabKey === "table"}
          onClick={() => applyTab("table")}
          disabled={pending}
        >
          Tableau
        </TabButton>

        {zoneSlugs.length > 0 ? (
          <span className="mx-1 hidden h-4 w-px bg-border sm:inline-block" aria-hidden />
        ) : null}
        {zoneSlugs.map((slug) => (
          <TabButton
            key={slug}
            active={activeTabKey === `zone:${slug}`}
            onClick={() => applyTab(`zone:${slug}`)}
            className="font-mono"
            disabled={pending}
          >
            {slug}
          </TabButton>
        ))}

        {orgViews.length > 0 ? (
          <span className="mx-1 hidden h-4 w-px bg-border sm:inline-block" aria-hidden />
        ) : null}
        {orgViews.map((view) => (
          <TabButton
            key={view.id}
            active={activeTabKey === `saved:${view.id}`}
            onClick={() => applyTab(`saved:${view.id}`)}
            disabled={pending}
          >
            <Users className="size-3 opacity-60" aria-hidden />
            {view.name}
          </TabButton>
        ))}

        {canManage ? (
          <>
            <Button
              type="button"
              variant="default"
              size="sm"
              className="ml-auto h-8 gap-1 rounded-full bg-amber-600 px-3 text-xs hover:bg-amber-600/90"
              disabled={pending}
              onClick={saveForEveryone}
            >
              {pending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Users className="size-3.5" />
              )}
              Enregistrer pour tous
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 gap-1 rounded-full px-2 text-xs"
                    disabled={pending}
                  />
                }
              >
                <Plus className="size-3.5" />
                Gérer
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                {orgViews.length === 0 ? (
                  <p className="px-2 py-1.5 text-xs text-muted-foreground">
                    Aucune vue partagée. Utilisez « Enregistrer pour tous ».
                  </p>
                ) : (
                  orgViews.map((view) => (
                    <DropdownMenuItem
                      key={view.id}
                      className="justify-between gap-2"
                      onClick={(e) => {
                        e.preventDefault();
                        deleteView(view.id, view.name);
                      }}
                    >
                      <span className="truncate">{view.name}</span>
                      <Trash2 className="size-3.5 shrink-0 text-muted-foreground" />
                    </DropdownMenuItem>
                  ))
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        ) : null}

        {activeTabKey.startsWith("zone:") ? (
          <span className="ml-auto text-xs text-muted-foreground">
            Grand livre · zone {activeTabKey.slice("zone:".length)}
          </span>
        ) : null}
      </div>
      {error ? (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
  className,
  disabled,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex h-8 items-center gap-1 rounded-full border px-3 text-xs font-medium transition-colors disabled:opacity-50",
        active
          ? "border-primary bg-primary/10 text-foreground"
          : "border-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground",
        className,
      )}
    >
      {children}
    </button>
  );
}
