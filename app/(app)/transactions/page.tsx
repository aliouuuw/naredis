import { getDb } from "@/lib/db";
import {
  LEDGER_MUTATION_ROLES,
  memberHasRole,
} from "@/lib/auth/permissions";
import { toModuleContext } from "@/lib/auth/module-context";
import { requireAuthContext } from "@/lib/auth/session";
import { agencyCalendarDate } from "@/lib/domain/timezone";
import { listCustomers } from "@/lib/modules/customers/service";
import {
  listDossiersForCustomer,
  listLedgerEntriesForOrganization,
} from "@/lib/modules/ledger/service";
import { serializeLedgerEntry } from "@/lib/modules/ledger/serialize";
import { listTransactionTypes } from "@/lib/modules/ledger/transaction-types";
import { TransactionsView } from "@/components/transactions/transactions-view";
import { PageHeader } from "@/components/shell/page-header";
import { NewTransactionButton } from "@/components/shell/page-actions";

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ customer?: string }>;
}) {
  const { customer: customerParam } = await searchParams;
  const auth = await requireAuthContext();
  const ctx = toModuleContext(auth);
  const db = getDb();
  const today = agencyCalendarDate();

  const [entries, customers, transactionTypes, canRecord] = await Promise.all([
    listLedgerEntriesForOrganization(db, ctx, {
      dateFrom: undefined,
      dateTo: undefined,
    }),
    listCustomers(db, ctx),
    listTransactionTypes(db, ctx),
    memberHasRole(auth.userId, auth.organizationId, LEDGER_MUTATION_ROLES),
  ]);

  const dossiersByCustomerId: Record<
    string,
    Awaited<ReturnType<typeof listDossiersForCustomer>>
  > = {};

  const customerIdsToLoad = customerParam
    ? [customerParam]
    : customers.slice(0, 20).map((c) => c.id);

  await Promise.all(
    customerIdsToLoad.map(async (id) => {
      dossiersByCustomerId[id] = await listDossiersForCustomer(db, ctx, id);
    }),
  );

  return (
    <div className="space-y-8">
      <PageHeader
        title="Transactions"
        description="Écritures comptables client (crédit / débit) — filtrez, regroupez et saisissez le jour ou l'historique."
        actions={
          canRecord ? (
            <NewTransactionButton customerId={customerParam} />
          ) : undefined
        }
      />

      <TransactionsView
        rows={entries.map(serializeLedgerEntry)}
        customers={customers.map((c) => ({ id: c.id, name: c.name }))}
        transactionTypes={transactionTypes}
        dossiersByCustomerId={dossiersByCustomerId}
        canRecord={canRecord}
        defaultCustomerId={customerParam}
        defaultDateFrom={today}
      />
    </div>
  );
}
