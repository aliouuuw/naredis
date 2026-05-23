import Link from "next/link";
import { notFound } from "next/navigation";
import { Check } from "lucide-react";
import { getDb } from "@/lib/db";
import { formatXof } from "@/lib/domain/balance";
import { toModuleContext } from "@/lib/auth/module-context";
import { requireAuthContext } from "@/lib/auth/session";
import { getDeclarationById } from "@/lib/modules/declarations/service";
import { PageHeader } from "@/components/shell/page-header";

function formatMoney(value: bigint | null) {
  if (value == null) return "—";
  return `${formatXof(value)} XOF`;
}

export default async function DeclarationFichePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const auth = await requireAuthContext();
  const data = await getDeclarationById(getDb(), toModuleContext(auth), id);

  if (!data) {
    notFound();
  }

  const { declaration, dossier, customer, containers, payingAgencyName } = data;

  return (
    <div className="space-y-8">
      <PageHeader
        title={declaration.declarationNumber}
        description={`${customer.name} · BL ${dossier.blReference ?? "—"}`}
      />

      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded-lg border bg-card p-5 space-y-3">
          <h2 className="text-sm font-semibold">Logistique</h2>
          <dl className="grid grid-cols-[minmax(8rem,auto)_1fr] gap-2 text-sm">
            <dt className="text-muted-foreground">Zone / terminal</dt>
            <dd>{declaration.zoneOrTerminal ?? "—"}</dd>
            <dt className="text-muted-foreground">Date déclaration</dt>
            <dd>{declaration.declarationDate ?? "—"}</dd>
            <dt className="text-muted-foreground">Conteneurs</dt>
            <dd>
              {declaration.containerCount ?? 0}
              {containers.length > 0 ? (
                <ul className="mt-1 list-inside list-disc font-mono text-xs">
                  {containers.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
              ) : null}
            </dd>
            <dt className="text-muted-foreground">Bon à délivrer</dt>
            <dd className="flex items-center gap-2">
              {declaration.bonADelivrer ? (
                <>
                  <Check className="size-4 text-emerald-600" />
                  Oui
                </>
              ) : (
                "Non"
              )}
            </dd>
          </dl>
        </section>

        <section className="rounded-lg border bg-card p-5 space-y-3">
          <h2 className="text-sm font-semibold">Montants (fiche)</h2>
          <dl className="grid grid-cols-[minmax(8rem,auto)_1fr] gap-2 text-sm">
            <dt className="text-muted-foreground">Montant client</dt>
            <dd className="tabular-nums">{formatMoney(declaration.clientAmountPaid)}</dd>
            <dt className="text-muted-foreground">GAINDE</dt>
            <dd className="tabular-nums">{formatMoney(declaration.gaindeDutyAmount)}</dd>
            <dt className="text-muted-foreground">Prix de revient</dt>
            <dd className="tabular-nums">{formatMoney(declaration.costPrice)}</dd>
            <dt className="text-muted-foreground">Maison-mère</dt>
            <dd>{payingAgencyName ?? "—"}</dd>
          </dl>
        </section>
      </div>

      <p className="text-sm text-muted-foreground">
        <Link href="/declarations" className="hover:underline">
          ← Retour à la liste
        </Link>
        {" · "}
        <Link href={`/dossiers/${dossier.id}`} className="hover:underline">
          Dossier {dossier.dossierNumber}
        </Link>
        {" · "}
        <Link href={`/clients/${customer.id}`} className="hover:underline">
          Client {customer.slug}
        </Link>
      </p>
    </div>
  );
}
