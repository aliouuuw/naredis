import {
  activityActionLabel,
  activityEntityScopeLabel,
  formatActivityDetail,
} from "@/lib/domain/activity-labels";
import type { ActivityLogEntrySerialized } from "@/lib/modules/declarations/serialize-fiche";

function formatWhen(iso: string) {
  const value = new Date(iso);
  if (Number.isNaN(value.getTime())) return "—";
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

export function DeclarationActivityFeed({
  entries,
}: {
  entries: ActivityLogEntrySerialized[];
}) {
  if (entries.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Aucun événement enregistré pour cette déclaration, son dossier ou les
        écritures qui y sont liées.
      </p>
    );
  }

  return (
    <ol className="relative space-y-6 border-l border-border pl-6">
      {entries.map((entry) => {
        const detail = formatActivityDetail(entry.action, entry.payload);
        return (
          <li key={entry.id} className="relative">
            <span
              className="absolute -left-[1.6rem] top-1 size-2.5 rounded-full border-2 border-background bg-primary"
              aria-hidden
            />
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground">
                {formatWhen(entry.createdAt)}
              </p>
              <div className="rounded-lg border bg-muted/20 p-3 text-sm">
                <p className="font-medium">
                  {activityActionLabel(entry.action)}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {activityEntityScopeLabel(entry.entityType)}
                </p>
                {detail ? (
                  <p className="mt-2 text-sm text-foreground/90">{detail}</p>
                ) : null}
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
