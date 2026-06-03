"use client";

import { Columns3, ChevronDown, ChevronUp, RotateCcw } from "lucide-react";
import {
  moveColumnInPrefs,
  toggleColumnHidden,
  type TableColumnDef,
  type TableColumnPrefs,
} from "@/lib/ui/table-columns";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type TableColumnSettingsProps = {
  columns: readonly TableColumnDef[];
  prefs: TableColumnPrefs;
  onPrefsChange: (prefs: TableColumnPrefs) => void;
  onReset: () => void;
  className?: string;
};

export function TableColumnSettings({
  columns,
  prefs,
  onPrefsChange,
  onReset,
  className,
}: TableColumnSettingsProps) {
  const configurable = columns.filter((c) => !c.pinnedEnd);
  const byId = new Map(configurable.map((c) => [c.id, c]));
  const ordered = prefs.order
    .map((id) => byId.get(id))
    .filter((c): c is TableColumnDef => Boolean(c));

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={cn("h-8 gap-1.5 rounded-full", className)}
          />
        }
      >
        <Columns3 className="size-3.5" aria-hidden />
        Colonnes
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72">
        <PopoverHeader>
          <PopoverTitle>Colonnes du tableau</PopoverTitle>
          <PopoverDescription>
            Ordre et visibilité enregistrés sur cet appareil.
          </PopoverDescription>
        </PopoverHeader>
        <ul className="max-h-64 space-y-1 overflow-y-auto">
          {ordered.map((col, index) => {
            const visible = col.required || !prefs.hidden.includes(col.id);
            return (
              <li
                key={col.id}
                className="flex items-center gap-1 rounded-md border border-transparent px-1 py-0.5 hover:bg-muted/50"
              >
                <div className="flex shrink-0 flex-col">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-6"
                    disabled={index === 0}
                    aria-label={`Monter ${col.label}`}
                    onClick={() =>
                      onPrefsChange(moveColumnInPrefs(prefs, col.id, "up"))
                    }
                  >
                    <ChevronUp className="size-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-6"
                    disabled={index === ordered.length - 1}
                    aria-label={`Descendre ${col.label}`}
                    onClick={() =>
                      onPrefsChange(moveColumnInPrefs(prefs, col.id, "down"))
                    }
                  >
                    <ChevronDown className="size-3.5" />
                  </Button>
                </div>
                <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 py-1 text-sm">
                  <input
                    type="checkbox"
                    className="size-3.5 rounded border-input"
                    checked={visible}
                    disabled={col.required}
                    onChange={(e) =>
                      onPrefsChange(
                        toggleColumnHidden(prefs, col.id, e.target.checked),
                      )
                    }
                  />
                  <span className="truncate">{col.label}</span>
                </label>
              </li>
            );
          })}
        </ul>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="mt-1 h-8 w-full gap-1.5 text-muted-foreground"
          onClick={onReset}
        >
          <RotateCcw className="size-3.5" aria-hidden />
          Réinitialiser
        </Button>
      </PopoverContent>
    </Popover>
  );
}
