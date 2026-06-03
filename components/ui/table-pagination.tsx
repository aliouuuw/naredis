"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  TABLE_PAGE_SIZE,
  totalTablePages,
} from "@/lib/ui/table-pagination";
import { Button } from "@/components/ui/button";

type TablePaginationProps = {
  totalItems: number;
  page: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
  itemLabel?: string;
};

/**
 * Compact prev/next control for list tables (> pageSize rows).
 */
export function TablePagination({
  totalItems,
  page,
  pageSize = TABLE_PAGE_SIZE,
  onPageChange,
  itemLabel = "ligne",
}: TablePaginationProps) {
  if (totalItems <= pageSize) return null;

  const totalPages = totalTablePages(totalItems, pageSize);
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3 text-sm">
      <p className="text-muted-foreground tabular-nums">
        {start}–{end} sur {totalItems} {itemLabel}
        {totalItems === 1 ? "" : "s"}
        <span className="mx-2 text-border">·</span>
        Page {page} / {totalPages}
      </p>
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 gap-1"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="size-4" aria-hidden />
          Précédent
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 gap-1"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Suivant
          <ChevronRight className="size-4" aria-hidden />
        </Button>
      </div>
    </div>
  );
}
