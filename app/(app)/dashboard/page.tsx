import { Activity, AlertTriangle, Clock, FileText, Users } from "lucide-react";
import { requireAuthContext } from "@/lib/auth/session";
import { PageHeader } from "@/components/shell/page-header";
import {
  NewClientButton,
  NewDeclarationButton,
} from "@/components/shell/page-actions";

type SummaryCard = {
  label: string;
  value: string;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
};

const summaryCards: SummaryCard[] = [
  {
    label: "Déclarations en cours",
    value: "—",
    hint: "POL-002 — branchement",
    icon: FileText,
  },
  {
    label: "Dossiers ouverts",
    value: "—",
    hint: "Cases not closed",
    icon: Activity,
  },
  {
    label: "Soldes à surveiller",
    value: "—",
    hint: "Clients en souffrance",
    icon: Users,
  },
];

export default async function DashboardPage() {
  await requireAuthContext();

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
              <p className="mt-3 text-3xl font-semibold tracking-tight">
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
        <div className="rounded-lg border border-dashed bg-muted/30 px-6 py-10 text-center">
          <AlertTriangle className="mx-auto size-5 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">
            Aucune tâche prioritaire pour le moment.
          </p>
          <p className="text-xs text-muted-foreground">
            Déclarations stagnantes, n° douane manquants, soldes en souffrance,
            dossiers prêts à clôturer apparaîtront ici (POL-002).
          </p>
        </div>
      </section>

      <section aria-labelledby="dash-activity" className="space-y-3">
        <h2
          id="dash-activity"
          className="text-sm font-medium text-muted-foreground"
        >
          Activité récente
        </h2>
        <div className="rounded-lg border border-dashed bg-muted/30 px-6 py-10 text-center">
          <Clock className="mx-auto size-5 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">
            L&apos;activité du cabinet apparaîtra ici.
          </p>
        </div>
      </section>
    </div>
  );
}
