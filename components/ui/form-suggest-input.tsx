"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type FormSuggestOption = {
  value: string;
  label?: string;
  hint?: string;
  group?: string;
};

function normalizeOptions(
  options: (string | FormSuggestOption)[],
): FormSuggestOption[] {
  return options.map((o) =>
    typeof o === "string" ? { value: o, label: o } : o,
  );
}

function filterOptions(options: FormSuggestOption[], query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return options.slice(0, 12);
  return options
    .filter(
      (o) =>
        o.value.toLowerCase().includes(q) ||
        (o.label?.toLowerCase().includes(q) ?? false) ||
        (o.hint?.toLowerCase().includes(q) ?? false),
    )
    .slice(0, 12);
}

type FormSuggestInputProps = Omit<
  React.ComponentProps<typeof Input>,
  "value" | "defaultValue" | "onChange"
> & {
  name?: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  suggestions?: (string | FormSuggestOption)[];
  emptyHint?: string;
  /** Shown under the field when suggestions exist. */
  helperText?: string;
};

export function FormSuggestInput({
  id,
  name,
  value: valueProp,
  defaultValue = "",
  onValueChange,
  suggestions = [],
  emptyHint = "Aucune valeur enregistrée — saisissez librement.",
  helperText = "Valeurs existantes proposées — vous pouvez aussi saisir une nouvelle valeur.",
  className,
  disabled,
  onFocus,
  onBlur,
  ...inputProps
}: FormSuggestInputProps) {
  const isControlled = valueProp !== undefined;
  const [internal, setInternal] = React.useState(defaultValue);
  const value = isControlled ? valueProp : internal;

  const [open, setOpen] = React.useState(false);
  const [activeIndex, setActiveIndex] = React.useState(0);
  const listId = React.useId();
  const rootRef = React.useRef<HTMLDivElement>(null);

  const normalized = React.useMemo(
    () => normalizeOptions(suggestions),
    [suggestions],
  );
  const filtered = React.useMemo(
    () => filterOptions(normalized, value),
    [normalized, value],
  );

  React.useEffect(() => {
    if (!isControlled) setInternal(defaultValue);
  }, [defaultValue, isControlled]);

  React.useEffect(() => {
    setActiveIndex(0);
  }, [value, open]);

  function setValue(next: string) {
    if (!isControlled) setInternal(next);
    onValueChange?.(next);
  }

  function pick(option: FormSuggestOption) {
    setValue(option.value);
    setOpen(false);
  }

  function handleBlur(event: React.FocusEvent<HTMLInputElement>) {
    onBlur?.(event);
    window.setTimeout(() => {
      if (!rootRef.current?.contains(document.activeElement)) {
        setOpen(false);
      }
    }, 120);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!open && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
      setOpen(true);
      return;
    }
    if (!open || filtered.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((i) => (i + 1) % filtered.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((i) => (i - 1 + filtered.length) % filtered.length);
    } else if (event.key === "Enter" && filtered[activeIndex]) {
      event.preventDefault();
      pick(filtered[activeIndex]!);
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  }

  const grouped = React.useMemo(() => {
    const map = new Map<string, FormSuggestOption[]>();
    for (const o of filtered) {
      const g = o.group ?? "Existant";
      const list = map.get(g) ?? [];
      list.push(o);
      map.set(g, list);
    }
    return [...map.entries()];
  }, [filtered]);

  const showList = open && !disabled;
  const hasSuggestions = normalized.length > 0;

  return (
    <div ref={rootRef} className="relative w-full min-w-0 space-y-1">
      <div className="relative">
        <Input
          id={id}
          name={name}
          value={value}
          disabled={disabled}
          autoComplete="off"
          aria-autocomplete="list"
          aria-expanded={showList}
          aria-controls={showList ? listId : undefined}
          className={cn(hasSuggestions && "pr-8", className)}
          onChange={(e) => setValue(e.target.value)}
          onFocus={(e) => {
            setOpen(true);
            onFocus?.(e);
          }}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          {...inputProps}
        />
        {hasSuggestions ? (
          <ChevronDown
            className="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
        ) : null}
      </div>

      {hasSuggestions && helperText ? (
        <p className="text-xs text-muted-foreground">{helperText}</p>
      ) : null}

      {showList ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-50 mt-1 max-h-52 w-full overflow-auto rounded-lg border bg-popover py-1 text-sm shadow-md ring-1 ring-foreground/10"
        >
          {filtered.length === 0 ? (
            <li className="px-3 py-2 text-xs text-muted-foreground">
              {emptyHint}
            </li>
          ) : (
            grouped.map(([group, items]) => (
              <li key={group} role="presentation">
                <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {group}
                </p>
                <ul role="group">
                  {items.map((option) => {
                    const flatIndex = filtered.indexOf(option);
                    const selected = flatIndex === activeIndex;
                    return (
                      <li key={`${group}-${option.value}`} role="presentation">
                        <button
                          type="button"
                          role="option"
                          aria-selected={selected}
                          className={cn(
                            "flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left transition-colors hover:bg-muted",
                            selected && "bg-muted",
                          )}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => pick(option)}
                        >
                          <span className="font-medium">
                            {option.label ?? option.value}
                          </span>
                          {option.hint &&
                          option.hint !== (option.label ?? option.value) ? (
                            <span className="text-xs text-muted-foreground">
                              {option.hint}
                            </span>
                          ) : null}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  );
}
