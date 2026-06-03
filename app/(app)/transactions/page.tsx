import { getDb } from "@/lib/db";
import {
  LEDGER_MUTATION_ROLES,
  memberHasRole,
} from "@/lib/auth/permissions";
import { toModuleContext } from "@/lib/auth/module-context";
import { requireAuthContext } from "@/lib/auth/session";
import { agencyCalendarDate } from "@/lib/domain/timezone";
import { listCustomers } from "@/lib/modules/customers/service";
import { getOrgFormSuggestions } from "@/lib/modules/form-suggestions/service";
import {
  countLedgerEntriesForOrganization,
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
import { OrgFormSuggestionsProvider } from "@/components/providers/org-form-suggestions-provider";
import { TransactionsView } from "@/components/transactions/transactions-view";
import { PageHeader } from "@/components/shell/page-header";
import { RecordTransactionLauncher } from "@/components/transactions/record-transaction-launcher";
import { parseTablePage, TABLE_PAGE_SIZE } from "@/lib/ui/table-pagination";

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

  const recordIntent = (() => {
    const v = params.record;
    return (Array.isArray(v) ? v[0] : v) === "1";
  })();

  const viewState = parseTransactionsViewState(params, today);
  const ledgerFilters = rulesToLedgerFilters(
    viewState.rules,
    viewState.dateFrom,
    viewState.dateTo,
  );

  const pageParam = params.page;
  const page = parseTablePage(
    Array.isArray(pageParam) ? pageParam[0] : pageParam,
  );
  const offset = (page - 1) * TABLE_PAGE_SIZE;

  const customerId = activeFilterRules(viewState.rules).find(
    (r) => r.field === "customer" && r.operator === "eq",
  )?.value;

  const [
    entries,
    totalCount,
    customers,
    transactionTypes,
    canRecord,
    dossiers,
    formSuggestions,
  ] = await Promise.all([
    listLedgerEntriesForOrganization(db, ctx, ledgerFilters, {
      limit: TABLE_PAGE_SIZE,
      offset,
      sort: viewState.sort,
    }),
    countLedgerEntriesForOrganization(db, ctx, ledgerFilters),
    listCustomers(db, ctx),
    listTransactionTypes(db, ctx),
    memberHasRole(auth.userId, auth.organizationId, LEDGER_MUTATION_ROLES),
    customerId
      ? listDossiersForCustomer(db, ctx, customerId)
      : Promise.resolve([]),
    getOrgFormSuggestions(db, ctx),
  ]);

  return (
    <OrgFormSuggestionsProvider suggestions={formSuggestions}>
      <div className="space-y-8">
        <PageHeader
          title="Transactions"
          description="Grand livre — écritures en débit/crédit, filtres combinables et regroupements. Vue synchronisée dans l'URL."
          actions={
            canRecord ? (
              <RecordTransactionLauncher
                customers={customers.map((c) => ({ id: c.id, name: c.name }))}
                transactionTypes={transactionTypes}
                initialCustomerId={customerId}
                initialDossiers={dossiers}
                recordIntent={recordIntent}
              />
            ) : undefined
          }
        />

        <TransactionsView
          rows={entries.map(serializeLedgerEntry)}
          totalCount={totalCount}
          customers={customers.map((c) => ({ id: c.id, name: c.name }))}
          transactionTypes={transactionTypes}
          dossiers={dossiers}
          canRecord={canRecord}
          viewState={viewState}
          today={today}
          recordIntent={recordIntent}
        />
      </div>
    </OrgFormSuggestionsProvider>
  );
}
