import { getDb } from "@/lib/db";
import { toModuleContext } from "@/lib/auth/module-context";
import { requireAuthContext } from "@/lib/auth/session";
import { listAgencies } from "@/lib/modules/agencies/service";
import { PageHeader } from "@/components/shell/page-header";

export default async function SettingsPage() {
  const auth = await requireAuthContext();
  const agencies = await listAgencies(getDb(), toModuleContext(auth), false);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Réglages"
        description="Cabinet, agences (maison-mère / cartes GAINDE) et membres."
      />

      <section className="space-y-4">
        <h2 className="text-sm font-semibold">Agences (maison-mère)</h2>
        {agencies.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aucune agence configurée. Ajout du formulaire à venir (DOM-008 UI).
          </p>
        ) : (
          <ul className="divide-y rounded-lg border bg-card">
            {agencies.map((agency) => (
              <li
                key={agency.id}
                className="flex items-center justify-between px-4 py-3 text-sm"
              >
                <span className="font-medium">{agency.name}</span>
                <span className="text-muted-foreground">
                  {agency.isActive ? "Active" : "Inactive"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
