import Link from "next/link";
import { notFound } from "next/navigation";
import { getDb } from "@/lib/db";
import { formatBalanceLabel, formatXof } from "@/lib/domain/balance";
import { toModuleContext } from "@/lib/auth/module-context";
import { requireAuthContext } from "@/lib/auth/session";
import { getCustomerFiche } from "@/lib/modules/customers/service";
import { PageHeader } from "@/components/shell/page-header";

const accountStatusLabel = {
  a_jour: "À jour",
  pas_a_jour: "Pas à jour",
} as const;

export default async function ClientFichePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const auth = await requireAuthContext();
  const fiche = await getCustomerFiche(getDb(), toModuleContext(auth), id);

  if (!fiche) {
    notFound();
  }

  const { customer, balance, dayOpenBalance, feesAllTime, transactionsToday } =
    fiche;

  return (
    <div className="space-y-8">
      <PageHeader
        title={customer.name}
        description={`Identifiant : ${customer.slug}`}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs text-muted-foreground">Solde</p>
          <p className="mt-1 text-lg font-semibold tabular-nums">
            {formatXof(balance.amount)} XOF
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              {formatBalanceLabel(balance.side)}
            </span>
          </p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs text-muted-foreground">Report (ouverture jour)</p>
          <p className="mt-1 text-lg font-semibold tabular-nums">
            {formatXof(dayOpenBalance.amount)} XOF
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              {formatBalanceLabel(dayOpenBalance.side)}
            </span>
          </p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs text-muted-foreground">Frais dossiers (total)</p>
          <p className="mt-1 text-lg font-semibold tabular-nums">
            {formatXof(feesAllTime)} XOF
          </p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs text-muted-foreground">Transactions aujourd&apos;hui</p>
          <p className="mt-1 text-lg font-semibold tabular-nums">
            {formatXof(transactionsToday)} XOF
          </p>
        </div>
      </div>

      <dl className="grid max-w-lg gap-2 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Téléphone</dt>
          <dd>{customer.phone ?? "—"}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Statut compte</dt>
          <dd>{accountStatusLabel[customer.accountStatus]}</dd>
        </div>
      </dl>

      <p className="text-sm text-muted-foreground">
        <Link href="/clients" className="hover:underline">
          ← Retour à la liste
        </Link>
      </p>
    </div>
  );
}
