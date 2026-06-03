"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { formatXof } from "@/lib/domain/balance";
import type { LedgerGroupNode } from "@/lib/modules/ledger/transactions-query";
import { GROUP_DIMENSION_LABELS } from "@/lib/modules/ledger/transactions-query";
import { LedgerEntriesTable } from "./ledger-entries-table";

function GroupTotals({ node }: { node: LedgerGroupNode }) {
  const signed = node.totalAmount;
  const zero = BigInt(0);
  const abs = signed < zero ? -signed : signed;
  const sideLabel =
    signed === zero ? "" : signed > zero ? "· net crédit" : "· net débit";

  return (
    <span className="text-xs font-normal tabular-nums text-muted-foreground">
      {node.count} écriture{node.count !== 1 ? "s" : ""}
      {signed !== zero ? (
        <>
          {" "}
          · {formatXof(abs)} XOF {sideLabel}
        </>
      ) : null}
    </span>
  );
}

function GroupSection({
  node,
  depth,
  showCustomer,
  defaultOpen,
}: {
  node: LedgerGroupNode;
  depth: number;
  showCustomer: boolean;
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen || depth < 2);
  const hasChildren = node.children && node.children.length > 0;
  const hasRows = node.rows && node.rows.length > 0;

  if (!hasChildren && !hasRows) return null;

  const dimensionLabel = node.dimension
    ? GROUP_DIMENSION_LABELS[node.dimension]
    : null;

  return (
    <section
      className={depth > 0 ? "ml-3 border-l border-border pl-4" : undefined}
    >
      {node.key !== "flat" ? (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="mb-2 flex w-full items-center gap-2 text-left"
        >
          {open ? (
            <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
          ) : (
            <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
          )}
          <span className="text-sm font-semibold">
            {dimensionLabel ? (
              <span className="mr-1.5 text-xs font-normal uppercase tracking-wide text-muted-foreground">
                {dimensionLabel}
              </span>
            ) : null}
            {node.label}
          </span>
          <GroupTotals node={node} />
        </button>
      ) : null}

      {open ? (
        <div className="space-y-4">
          {hasChildren
            ? node.children!.map((child) => (
                <GroupSection
                  key={child.key}
                  node={child}
                  depth={depth + 1}
                  showCustomer={showCustomer}
                  defaultOpen={depth + 1 < 1}
                />
              ))
            : null}
          {hasRows ? (
            <LedgerEntriesTable rows={node.rows!} showCustomer={showCustomer} />
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

export function GroupedLedgerList({
  tree,
  showCustomer,
}: {
  tree: LedgerGroupNode[];
  showCustomer: boolean;
}) {
  if (tree.length === 0) {
    return (
      <p className="rounded-lg border border-dashed bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
        Aucune transaction pour ces filtres.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {tree.map((node) => (
        <GroupSection
          key={node.key}
          node={node}
          depth={0}
          showCustomer={showCustomer}
          defaultOpen
        />
      ))}
    </div>
  );
}
