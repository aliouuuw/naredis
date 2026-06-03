import Link from "next/link";
import {
  activityActionLabel,
  activityEntityScopeLabel,
  activityItemHref,
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

export function DashboardActivityFeed({
  entries,
}: {
  entries: ActivityLogEntrySerialized[];
}) {
  if (entries.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Aucune activité récente enregistrée.
      </p>
    );
  }

  return (
    <ul className="divide-y rounded-lg border bg-card">
      {entries.map((entry) => {
        const href = activityItemHref(entry.entityType, entry.entityId);
        const detail = formatActivityDetail(entry.action, entry.payload);
        return (
          <li key={entry.id} className="px-4 py-3 text-sm">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="font-medium">{activityActionLabel(entry.action)}</p>
              <time
                className="text-xs text-muted-foreground"
                dateTime={entry.createdAt}
              >
                {formatWhen(entry.createdAt)}
              </time>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {activityEntityScopeLabel(entry.entityType)}
            </p>
            {detail ? (
              <p className="mt-1 text-sm text-foreground/90">{detail}</p>
            ) : null}
            {href ? (
              <p className="mt-2">
                <Link href={href} className="text-xs font-medium hover:underline">
                  Voir →
                </Link>
              </p>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
