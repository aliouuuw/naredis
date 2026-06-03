import { Activity, FileText, Users } from "lucide-react";
import { getDb } from "@/lib/db";
import { toModuleContext } from "@/lib/auth/module-context";
import { requireAuthContext } from "@/lib/auth/session";
import { getDashboardSnapshot } from "@/lib/modules/dashboard/service";
import { serializeActivityLog } from "@/lib/modules/dossiers/serialize-hub";
import { DashboardActivityFeed } from "@/components/dashboard/dashboard-activity-feed";
import { DashboardTodoList } from "@/components/dashboard/dashboard-todo-list";
import { PageHeader } from "@/components/shell/page-header";
import {
  NewClientButton,
  NewDeclarationButton,
} from "@/components/shell/page-actions";

export default async function DashboardPage() {
  const auth = await requireAuthContext();
  const ctx = toModuleContext(auth);
  const db = getDb();
  const snapshot = await getDashboardSnapshot(db, ctx);
  const activity = serializeActivityLog(snapshot.recentActivity);

  const summaryCards = [
    {
      label: "Déclarations en cours",
      value: String(snapshot.declarationsEnCours),
      hint: "Sans bon à délivrer",
      icon: FileText,
    },
    {
      label: "Dossiers ouverts",
      value: String(snapshot.dossiersOuverts),
      hint: "Cases non clôturées",
      icon: Activity,
    },
    {
      label: "Soldes à surveiller",
      value: String(snapshot.soldesASurveiller),
      hint: "Clients pas à jour",
      icon: Users,
    },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Tableau de bord"
        description="Vue d'ensemble opérationnelle — synthèse, à faire et activité récente."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <NewDeclarationButton />
            <NewClientButton />
          </div>
        }
      />

      <section aria-labelledby="dash-summary" className="space-y-3">
        <h2 id="dash-summary" className="text-sm font-medium text-muted-foreground">
          Synthèse
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {summaryCards.map((card) => (
            <article
              key={card.label}
              className="rounded-lg border bg-card p-5"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-muted-foreground">
                  {card.label}
                </p>
                <card.icon className="size-4 text-muted-foreground" />
              </div>
              <p className="mt-3 text-3xl font-semibold tracking-tight tabular-nums">
                {card.value}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{card.hint}</p>
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="dash-todo" className="space-y-3">
        <div className="flex items-baseline justify-between gap-3">
          <h2 id="dash-todo" className="text-sm font-medium text-muted-foreground">
            À faire
          </h2>
          <span className="text-xs text-muted-foreground">
            Tâches prioritaires multi-entités
          </span>
        </div>
        <DashboardTodoList items={snapshot.todo} />
      </section>

      <section aria-labelledby="dash-activity" className="space-y-3">
        <h2
          id="dash-activity"
          className="text-sm font-medium text-muted-foreground"
        >
          Activité récente
        </h2>
        <DashboardActivityFeed entries={activity} />
      </section>
    </div>
  );
}
