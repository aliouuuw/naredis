"use client";

import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

export function EntityViewToolbarShell({
  open,
  onOpenChange,
  summary,
  pending,
  headerActions,
  children,
  footer,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  summary: string;
  pending?: boolean;
  headerActions?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <section className="rounded-lg border bg-card">
      <Collapsible open={open} onOpenChange={onOpenChange}>
        <div className="flex items-start gap-2 p-3">
          {headerActions ? (
            <div className="order-last flex shrink-0 flex-wrap items-center gap-2 sm:order-none">
              {headerActions}
            </div>
          ) : null}
          <CollapsibleTrigger
            className={cn(
              "group/trigger flex flex-1 items-start gap-2 rounded-md text-left outline-none",
              "focus-visible:ring-3 focus-visible:ring-ring/50",
            )}
          >
            <ChevronDown className="mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform group-data-panel-open/trigger:rotate-180" />
            <div className="min-w-0 flex-1 space-y-0.5">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-sm font-semibold">Filtres et vue</h2>
                {pending ? (
                  <span className="text-xs text-muted-foreground">
                    Mise à jour…
                  </span>
                ) : null}
              </div>
              <p className="text-xs text-muted-foreground">{summary}</p>
            </div>
          </CollapsibleTrigger>
        </div>

        <CollapsibleContent className="border-t px-3 pb-3 pt-2">
          <div className="space-y-5">{children}</div>
          {footer ? <div className="mt-4 border-t pt-3">{footer}</div> : null}
        </CollapsibleContent>
      </Collapsible>
    </section>
  );
}
