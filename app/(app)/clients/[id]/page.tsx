import Link from "next/link";
import { notFound } from "next/navigation";
import { getDb } from "@/lib/db";
import {
  LEDGER_MUTATION_ROLES,
  memberHasRole,
} from "@/lib/auth/permissions";
import { toModuleContext } from "@/lib/auth/module-context";
import { requireAuthContext } from "@/lib/auth/session";
import { listDeclarationsForCustomer } from "@/lib/modules/declarations/service";
import { serializeDeclarationListItem } from "@/lib/modules/declarations/serialize-list";
import {
  listDossiersForCustomer,
  listLedgerEntriesForCustomer,
} from "@/lib/modules/ledger/service";
import { serializeLedgerEntry } from "@/lib/modules/ledger/serialize";
import { listTransactionTypes } from "@/lib/modules/ledger/transaction-types";
import { getCustomerFiche } from "@/lib/modules/customers/service";
import { CustomerFicheTabs } from "@/components/clients/customer-fiche-tabs";
import { PageHeader } from "@/components/shell/page-header";
import { RecordPaymentButton } from "@/components/shell/page-actions";

export default async function ClientFichePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const { tab: tabParam } = await searchParams;
  const auth = await requireAuthContext();
  const ctx = toModuleContext(auth);

  const [fiche, ledgerRows, dossiers, declarationRows, transactionTypes, canRecordLedger] =
    await Promise.all([
      getCustomerFiche(getDb(), ctx, id),
      listLedgerEntriesForCustomer(getDb(), ctx, id),
      listDossiersForCustomer(getDb(), ctx, id),
      listDeclarationsForCustomer(getDb(), ctx, id),
      listTransactionTypes(getDb(), ctx),
      memberHasRole(auth.userId, auth.organizationId, LEDGER_MUTATION_ROLES),
    ]);

  if (!fiche) {
    notFound();
  }

  const { customer, balance, dayOpenBalance, feesAllTime, transactionsToday } =
    fiche;

  const initialTab =
    tabParam === "transactions"
      ? ("transactions" as const)
      : tabParam === "declarations"
        ? ("declarations" as const)
        : undefined;

  return (
    <div className="space-y-8">
      <PageHeader
        title={customer.name}
        description={`Identifiant : ${customer.slug}`}
        actions={
          canRecordLedger ? (
            <RecordPaymentButton customerId={customer.id} />
          ) : undefined
        }
      />

      <CustomerFicheTabs
        customer={{
          id: customer.id,
          name: customer.name,
          slug: customer.slug,
          phone: customer.phone,
          accountStatus: customer.accountStatus,
        }}
        balance={{
          amount: balance.amount.toString(),
          side: balance.side,
        }}
        dayOpenBalance={{
          amount: dayOpenBalance.amount.toString(),
          side: dayOpenBalance.side,
        }}
        feesAllTime={feesAllTime.toString()}
        transactionsToday={transactionsToday.toString()}
        ledgerEntries={ledgerRows.map(serializeLedgerEntry)}
        dossiers={dossiers}
        declarations={declarationRows.map(serializeDeclarationListItem)}
        transactionTypes={transactionTypes}
        canRecordLedger={canRecordLedger}
        initialTab={initialTab}
      />

      <p className="text-sm text-muted-foreground">
        <Link href="/clients" className="hover:underline">
          ← Retour à la liste
        </Link>
      </p>
    </div>
  );
}
