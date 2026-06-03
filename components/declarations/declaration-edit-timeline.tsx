import { declarationFieldLabel, formatEditLogValue } from "@/lib/domain/declaration-fields";
import type { DeclarationEditLogEntrySerialized } from "@/lib/modules/declarations/serialize-fiche";

function formatWhen(date: Date | string) {
  const value = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(value.getTime())) {
    return "—";
  }
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

export function DeclarationEditTimeline({
  entries,
  agencyNameById = {},
}: {
  entries: DeclarationEditLogEntrySerialized[];
  agencyNameById?: Record<string, string>;
}) {
  const displayContext = { agencyNameById };
  if (entries.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Aucune modification enregistrée. Les changements de fiche apparaîtront ici
        (rectificative).
      </p>
    );
  }

  return (
    <ol className="relative space-y-6 border-l border-border pl-6">
      {entries.map((entry) => (
        <li key={entry.id} className="relative">
          <span
            className="absolute -left-[1.6rem] top-1 size-2.5 rounded-full border-2 border-background bg-primary"
            aria-hidden
          />
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">{formatWhen(entry.changedAt)}</p>
            <ul className="space-y-2 rounded-lg border bg-muted/20 p-3 text-sm">
              {Object.entries(entry.changes).map(([field, diff]) => (
                <li key={field}>
                  <span className="font-medium">{declarationFieldLabel(field)}</span>
                  <span className="text-muted-foreground"> : </span>
                  <span className="text-muted-foreground line-through">
                    {formatEditLogValue(field, diff.from, displayContext)}
                  </span>
                  <span className="mx-1 text-muted-foreground">→</span>
                  <span>{formatEditLogValue(field, diff.to, displayContext)}</span>
                </li>
              ))}
            </ul>
          </div>
        </li>
      ))}
    </ol>
  );
}
