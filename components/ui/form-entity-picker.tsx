"use client";

import * as React from "react";
import { ChevronDown, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type FormEntityOption = {
  value: string;
  label: string;
  hint?: string;
};

type FormEntityPickerProps = {
  id?: string;
  name?: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  options: FormEntityOption[];
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
};

export function FormEntityPicker({
  id,
  name,
  value: valueProp,
  defaultValue = "",
  onValueChange,
  options,
  placeholder = "Rechercher…",
  required,
  disabled,
  className,
  "aria-label": ariaLabel,
}: FormEntityPickerProps) {
  const isControlled = valueProp !== undefined;
  const [internal, setInternal] = React.useState(defaultValue);
  const selectedId = isControlled ? valueProp : internal;

  const [query, setQuery] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [activeIndex, setActiveIndex] = React.useState(0);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const listId = React.useId();

  const selected = options.find((o) => o.value === selectedId);

  React.useEffect(() => {
    if (!isControlled) setInternal(defaultValue);
  }, [defaultValue, isControlled]);

  React.useEffect(() => {
    if (selected) {
      setQuery(selected.label);
    }
  }, [selected?.value, selected?.label]);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options.slice(0, 15);
    return options
      .filter(
        (o) =>
          o.label.toLowerCase().includes(q) ||
          (o.hint?.toLowerCase().includes(q) ?? false),
      )
      .slice(0, 15);
  }, [options, query]);

  React.useEffect(() => {
    setActiveIndex(0);
  }, [query, open]);

  function select(option: FormEntityOption) {
    if (!isControlled) setInternal(option.value);
    onValueChange?.(option.value);
    setQuery(option.label);
    setOpen(false);
  }

  function clearSelection() {
    if (!isControlled) setInternal("");
    onValueChange?.("");
    setQuery("");
  }

  function handleBlur() {
    window.setTimeout(() => {
      if (!rootRef.current?.contains(document.activeElement)) {
        setOpen(false);
        if (selected) setQuery(selected.label);
        else if (!selectedId) setQuery("");
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
      select(filtered[activeIndex]!);
    } else if (event.key === "Escape") {
      setOpen(false);
      if (selected) setQuery(selected.label);
    }
  }

  const showList = open && !disabled;

  return (
    <div ref={rootRef} className={cn("relative w-full min-w-0 space-y-1", className)}>
      {name ? (
        <input
          type="hidden"
          name={name}
          value={selectedId}
          required={required}
        />
      ) : null}
      <div className="relative">
        <Search
          className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          id={id}
          value={query}
          disabled={disabled}
          autoComplete="off"
          aria-label={ariaLabel}
          aria-autocomplete="list"
          aria-expanded={showList}
          aria-controls={showList ? listId : undefined}
          placeholder={placeholder}
          className="pl-8 pr-8"
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            if (selectedId && e.target.value !== selected?.label) {
              clearSelection();
            }
          }}
          onFocus={() => setOpen(true)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
        />
        <ChevronDown
          className="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Tapez pour filtrer les enregistrements existants.
      </p>

      {showList ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-50 mt-1 max-h-56 w-full overflow-auto rounded-lg border bg-popover py-1 text-sm shadow-md ring-1 ring-foreground/10"
        >
          {filtered.length === 0 ? (
            <li className="px-3 py-2 text-xs text-muted-foreground">
              Aucun résultat — vérifiez l&apos;orthographe.
            </li>
          ) : (
            filtered.map((option, index) => (
              <li key={option.value} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={index === activeIndex}
                  className={cn(
                    "flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left hover:bg-muted",
                    index === activeIndex && "bg-muted",
                    option.value === selectedId && "font-medium",
                  )}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => select(option)}
                >
                  <span>{option.label}</span>
                  {option.hint ? (
                    <span className="text-xs text-muted-foreground">
                      {option.hint}
                    </span>
                  ) : null}
                </button>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  );
}
