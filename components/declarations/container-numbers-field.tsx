"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Minus, Plus, ClipboardPaste } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

function parsePastedText(text: string): string[] {
  return text
    .split(/[\n,;]+/)
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);
}

function rowsFromContainers(containers: string[]): string[] {
  const base = containers.map((c) => c.trim().toUpperCase()).filter(Boolean);
  if (base.length === 0) return [""];
  return [...base, ""];
}

export type ContainerNumbersFieldProps = {
  /** Reset when parent formKey changes. */
  formKey?: string;
  initialContainers: string[];
  initialCount?: number;
  disabled?: boolean;
  idPrefix?: string;
  onChange?: (payload: { containers: string[]; containerCount: number }) => void;
};

export function ContainerNumbersField({
  formKey,
  initialContainers,
  initialCount = 0,
  disabled = false,
  idPrefix = "container",
  onChange,
}: ContainerNumbersFieldProps) {
  const groupId = useId();
  const [count, setCount] = useState(() =>
    Math.max(0, initialCount ?? initialContainers.length),
  );
  const [rows, setRows] = useState<string[]>(() =>
    rowsFromContainers(initialContainers),
  );
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteValue, setPasteValue] = useState("");

  useEffect(() => {
    setCount(Math.max(0, initialCount ?? initialContainers.length));
    setRows(rowsFromContainers(initialContainers));
    setPasteOpen(false);
    setPasteValue("");
  }, [formKey, initialContainers, initialCount]);

  const filled = useMemo(
    () => rows.map((r) => r.trim()).filter(Boolean),
    [rows],
  );

  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    onChangeRef.current?.({
      containers: filled,
      containerCount: count,
    });
  }, [filled, count]);

  function updateRow(index: number, value: string) {
    setRows((prev) => {
      const next = [...prev];
      next[index] = value.toUpperCase();
      return next;
    });
  }

  function addRow() {
    setRows((prev) => [...prev, ""]);
  }

  function removeRow(index: number) {
    setRows((prev) => {
      if (prev.length <= 1) return [""];
      return prev.filter((_, i) => i !== index);
    });
  }

  function applyPaste() {
    const parsed = parsePastedText(pasteValue);
    if (parsed.length === 0) return;
    setRows([...parsed, ""]);
    if (parsed.length > count) {
      setCount(parsed.length);
    }
    setPasteOpen(false);
    setPasteValue("");
  }

  const idsShort =
    count > 0 && filled.length > 0 && filled.length < count;
  const idsLong = count > 0 && filled.length > count;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:max-w-xs">
        <label htmlFor={`${idPrefix}-count`} className="text-sm font-medium">
          Nombre de conteneurs
        </label>
        <Input
          id={`${idPrefix}-count`}
          name="containerCount"
          type="number"
          min={0}
          step={1}
          value={count}
          onChange={(e) =>
            setCount(Math.max(0, Number.parseInt(e.target.value, 10) || 0))
          }
          disabled={disabled}
        />
        <p className="text-xs text-muted-foreground">
          À renseigner même si les numéros ne sont pas encore connus.
        </p>
      </div>

      <div
        className="space-y-3"
        role="group"
        aria-labelledby={`${groupId}-label`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p id={`${groupId}-label`} className="text-sm font-medium">
              Numéros de conteneurs
            </p>
            <p className="text-xs text-muted-foreground">
              {filled.length === 0
                ? "Optionnel — à compléter quand les numéros sont disponibles."
                : `${filled.length} numéro${filled.length > 1 ? "s" : ""} renseigné${filled.length > 1 ? "s" : ""}`}
            </p>
          </div>
          {!disabled ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1"
              onClick={() => setPasteOpen((v) => !v)}
            >
              <ClipboardPaste className="size-3.5" aria-hidden />
              Coller une liste
            </Button>
          ) : null}
        </div>

        {pasteOpen && !disabled ? (
          <div className="space-y-2 rounded-lg border border-dashed bg-muted/30 p-3">
            <p className="text-xs text-muted-foreground">
              Collez plusieurs numéros séparés par des retours à la ligne ou des
              virgules.
            </p>
            <textarea
              value={pasteValue}
              onChange={(e) => setPasteValue(e.target.value)}
              rows={3}
              placeholder="MSCU1234567, MSCU7654321"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 font-mono text-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
            <div className="flex gap-2">
              <Button type="button" size="sm" onClick={applyPaste}>
                Appliquer
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => {
                  setPasteOpen(false);
                  setPasteValue("");
                }}
              >
                Annuler
              </Button>
            </div>
          </div>
        ) : null}

        <ul className="space-y-2">
          {rows.map((value, index) => (
            <li
              key={`${formKey ?? "new"}-${index}`}
              className="flex items-center gap-2"
            >
              <span
                className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-medium text-muted-foreground"
                aria-hidden
              >
                {index + 1}
              </span>
              <Input
                id={`${idPrefix}-${index}`}
                name={`container_${index}`}
                value={value}
                onChange={(e) => updateRow(index, e.target.value)}
                disabled={disabled}
                placeholder="MSCU1234567"
                className="font-mono uppercase tracking-wide"
                autoComplete="off"
                spellCheck={false}
              />
              {!disabled && rows.length > 1 ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                  aria-label={`Retirer le numéro ${index + 1}`}
                  onClick={() => removeRow(index)}
                >
                  <Minus className="size-4" />
                </Button>
              ) : (
                <span className="size-8 shrink-0" aria-hidden />
              )}
            </li>
          ))}
        </ul>

        {!disabled ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full gap-1 sm:w-auto"
            onClick={addRow}
          >
            <Plus className="size-4" aria-hidden />
            Ajouter un numéro
          </Button>
        ) : null}

        {idsShort ? (
          <p className={cn("text-xs text-amber-700 dark:text-amber-400")}>
            {filled.length} numéro(s) pour {count} conteneur
            {count > 1 ? "s" : ""} — vous pouvez enregistrer et compléter plus
            tard (requis pour le bon à délivrer).
          </p>
        ) : null}
        {idsLong ? (
          <p className={cn("text-xs text-amber-700 dark:text-amber-400")}>
            Plus de numéros ({filled.length}) que de conteneurs déclarés (
            {count}) — vérifiez le nombre ci-dessus.
          </p>
        ) : null}
      </div>

      {filled.map((num, i) => (
        <input key={`hidden-${i}`} type="hidden" name="containers" value={num} />
      ))}
    </div>
  );
}
