import Link from "next/link";
import { AlertTriangle, CheckCircle2, FileText, Users } from "lucide-react";
import type { DashboardTodoItem } from "@/lib/modules/dashboard/service";

const KIND_ICON: Record<
  DashboardTodoItem["kind"],
  React.ComponentType<{ className?: string }>
> = {
  declaration_pending: FileText,
  client_watch: Users,
  dossier_ready_to_close: CheckCircle2,
};

export function DashboardTodoList({ items }: { items: DashboardTodoItem[] }) {
  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed bg-muted/30 px-6 py-10 text-center">
        <AlertTriangle className="mx-auto size-5 text-muted-foreground" />
        <p className="mt-3 text-sm text-muted-foreground">
          Aucune tâche prioritaire pour le moment.
        </p>
      </div>
    );
  }

  return (
    <ul className="divide-y rounded-lg border bg-card">
      {items.map((item) => {
        const Icon = KIND_ICON[item.kind];
        return (
          <li key={item.id}>
            <Link
              href={item.href}
              className="flex items-start gap-3 px-4 py-3 text-sm transition-colors hover:bg-muted/40"
            >
              <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0">
                <p className="font-medium">{item.title}</p>
                <p className="text-xs text-muted-foreground">
                  {item.description}
                </p>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
