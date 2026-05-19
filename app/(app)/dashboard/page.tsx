import { requireAuthContext } from "@/lib/auth/session";

export default async function DashboardPage() {
  await requireAuthContext();

  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold tracking-tight">Tableau de bord</h1>
      <p className="text-sm text-muted-foreground">
        Indicateurs et synthèse — à venir (POL-002).
      </p>
    </div>
  );
}
