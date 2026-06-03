"use client";

import { useMemo } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { DateRange } from "react-day-picker";
import { CalendarIcon } from "lucide-react";
import { AGENCY_TIMEZONE } from "@/lib/domain/timezone";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

function parseCalendarDate(value: string): Date | undefined {
  if (!value) return undefined;
  return new Date(`${value}T12:00:00Z`);
}

function toCalendarDateString(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: AGENCY_TIMEZONE,
  }).format(date);
}

function formatDisplayDate(value: string): string {
  const d = parseCalendarDate(value);
  if (!d) return "—";
  return format(d, "d MMM yyyy", { locale: fr });
}

export function PeriodDateRange({
  dateFrom,
  dateTo,
  onChange,
  disabled,
}: {
  dateFrom: string;
  dateTo: string;
  onChange: (from: string, to: string) => void;
  disabled?: boolean;
}) {
  const selected = useMemo<DateRange | undefined>(() => {
    const from = parseCalendarDate(dateFrom);
    const to = parseCalendarDate(dateTo);
    if (!from && !to) return undefined;
    return { from, to };
  }, [dateFrom, dateTo]);

  const label =
    dateFrom && dateTo
      ? `${formatDisplayDate(dateFrom)} – ${formatDisplayDate(dateTo)}`
      : dateFrom
        ? `À partir du ${formatDisplayDate(dateFrom)}`
        : dateTo
          ? `Jusqu'au ${formatDisplayDate(dateTo)}`
          : "Choisir une plage (optionnel)";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Popover>
        <PopoverTrigger
          render={
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled}
              className={cn(
                "h-8 justify-start gap-2 font-normal",
                !dateFrom && !dateTo && "text-muted-foreground",
              )}
            />
          }
        >
          <CalendarIcon className="size-3.5 shrink-0 opacity-70" />
          <span className="truncate">{label}</span>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="range"
            numberOfMonths={2}
            defaultMonth={selected?.from ?? selected?.to}
            selected={selected}
            onSelect={(range) => {
              onChange(
                range?.from ? toCalendarDateString(range.from) : "",
                range?.to ? toCalendarDateString(range.to) : "",
              );
            }}
          />
        </PopoverContent>
      </Popover>
      {dateFrom || dateTo ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 text-xs"
          disabled={disabled}
          onClick={() => onChange("", "")}
        >
          Effacer les dates
        </Button>
      ) : null}
    </div>
  );
}
