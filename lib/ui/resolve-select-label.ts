export type SelectLabelOption = { value: string; label: string };

/** UUID / CUID-style values must never appear in select triggers. */
export function looksLikeOpaqueId(value: string): boolean {
  return (
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    ) || /^c[a-z0-9]{20,}$/i.test(value)
  );
}

/**
 * Resolve human-readable trigger text for a select value.
 * Prefer `FormSelect` instead of wiring `Select` + `SelectValue` manually.
 */
export function resolveSelectDisplayText(
  value: string,
  options: readonly SelectLabelOption[],
  config?: { placeholder?: string; emptyOption?: string },
): string | undefined {
  if (!value) {
    return config?.emptyOption ?? config?.placeholder;
  }

  const label = options.find((o) => o.value === value)?.label;
  if (label) return label;

  if (looksLikeOpaqueId(value)) {
    return config?.placeholder ?? "…";
  }

  return config?.placeholder;
}
