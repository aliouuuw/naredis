/** Shared helpers for URL-encoded entity filter rules (`field:operator:value`). */

export function newFilterRuleId(): string {
  return `r_${Math.random().toString(36).slice(2, 9)}`;
}

export function parseFilterTokens<TField extends string>(
  tokens: string[],
  allowedFields: readonly TField[],
  allowedOperators: readonly string[],
): Array<{
  id: string;
  field: TField;
  operator: string;
  value: string;
}> {
  const fields = new Set(allowedFields);
  const operators = new Set(allowedOperators);
  const out: Array<{
    id: string;
    field: TField;
    operator: string;
    value: string;
  }> = [];

  for (const raw of tokens) {
    const parts = raw.split(":");
    if (parts.length < 2) continue;
    const field = parts[0] as TField;
    if (!fields.has(field)) continue;
    const operator = parts[1] ?? "eq";
    if (!operators.has(operator)) continue;
    const value = parts.slice(2).join(":");
    out.push({
      id: newFilterRuleId(),
      field,
      operator,
      value,
    });
  }

  return out;
}

export function serializeFilterTokens<
  TRule extends { field: string; operator: string; value: string },
>(rules: TRule[]): string[] {
  return rules
    .filter((r) => r.value.trim() || r.operator === "empty")
    .map((r) => `${r.field}:${r.operator}:${r.value}`);
}
