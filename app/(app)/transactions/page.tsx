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
import {
  activeFilterRules,
  parseTransactionsViewState,
  rulesToLedgerFilters,
} from "@/lib/modules/ledger/transactions-query";
import { TransactionsView } from "@/components/transactions/transactions-view";
import { PageHeader } from "@/components/shell/page-header";
import { NewTransactionButton } from "@/components/shell/page-actions";

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const auth = await requireAuthContext();
  const ctx = toModuleContext(auth);
  const db = getDb();
  const today = agencyCalendarDate();

  const viewState = parseTransactionsViewState(params, today);
  const ledgerFilters = rulesToLedgerFilters(
    viewState.rules,
    viewState.dateFrom,
    viewState.dateTo,
  );

  const customerId = activeFilterRules(viewState.rules).find(
    (r) => r.field === "customer" && r.operator === "eq",
  )?.value;

  const [entries, customers, transactionTypes, canRecord, dossiers] =
    await Promise.all([
      listLedgerEntriesForOrganization(db, ctx, ledgerFilters),
      listCustomers(db, ctx),
      listTransactionTypes(db, ctx),
      memberHasRole(auth.userId, auth.organizationId, LEDGER_MUTATION_ROLES),
      customerId
        ? listDossiersForCustomer(db, ctx, customerId)
        : Promise.resolve([]),
    ]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Transactions"
        description="Filtres combinables, regroupements imbriqués et tri — la vue se synchronise dans l'URL pour partage et historique."
        actions={
          canRecord ? (
            <NewTransactionButton customerId={customerId} />
          ) : undefined
        }
      />

      <TransactionsView
        rows={entries.map(serializeLedgerEntry)}
        customers={customers.map((c) => ({ id: c.id, name: c.name }))}
        transactionTypes={transactionTypes}
        dossiers={dossiers}
        canRecord={canRecord}
        viewState={viewState}
        today={today}
      />
    </div>
  );
}
