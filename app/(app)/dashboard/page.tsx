import { requireAuthContext } from "@/lib/auth/session";
import { PageHeader } from "@/components/shell/page-header";

export default async function DashboardPage() {
  await requireAuthContext();

  return (
    <div className="space-y-8">
      <PageHeader
        title="Tableau de bord"
        description="Indicateurs et synthèse — à venir (POL-002)."
      />
    </div>
  );
}
