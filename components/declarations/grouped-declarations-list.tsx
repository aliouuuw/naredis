"use client";

import { formatXof } from "@/lib/domain/balance";
import type { DeclarationGroupNode } from "@/lib/modules/declarations/declarations-query";
import { cn } from "@/lib/utils";

export function GroupedDeclarationsList({
  nodes,
  depth = 0,
}: {
  nodes: DeclarationGroupNode[];
  depth?: number;
}) {
  return (
    <ul className={cn("space-y-2", depth > 0 && "ml-4 border-l pl-3")}>
      {nodes.map((node) => (
        <li key={node.key} className="rounded-md border bg-card">
          <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm">
            <span className="font-medium">{node.label}</span>
            <span className="text-xs text-muted-foreground tabular-nums">
              {node.count} décl. · Montant{" "}
              {formatXof(node.totals.clientAmountPaid)} XOF · GAINDE{" "}
              {formatXof(node.totals.gaindeDutyAmount)} XOF
            </span>
          </div>
          {node.children ? (
            <div className="border-t px-2 py-2">
              <GroupedDeclarationsList nodes={node.children} depth={depth + 1} />
            </div>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
