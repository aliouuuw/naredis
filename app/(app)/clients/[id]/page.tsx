import Link from "next/link";
import { Suspense } from "react";
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
  getCustomerFormSuggestions,
  getOrgFormSuggestions,
} from "@/lib/modules/form-suggestions/service";
import {
  listDossiersForCustomer,
  listLedgerEntriesForCustomer,
} from "@/lib/modules/ledger/service";
import { serializeLedgerEntry } from "@/lib/modules/ledger/serialize";
import { customerHasOpeningBalance } from "@/lib/modules/ledger/corrections";
import { listTransactionTypes } from "@/lib/modules/ledger/transaction-types";
import { listActivityForCustomer } from "@/lib/modules/activity/service";
import { getCustomerFiche } from "@/lib/modules/customers/service";
import { serializeActivityLog } from "@/lib/modules/dossiers/serialize-hub";
import { OrgFormSuggestionsProvider } from "@/components/providers/org-form-suggestions-provider";
import { CustomerFicheView } from "@/components/clients/customer-fiche-view";

export default async function ClientFichePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string; record?: string }>;
}) {
  const { id } = await params;
  const { tab: tabParam } = await searchParams;
  const auth = await requireAuthContext();
  const ctx = toModuleContext(auth);

  const db = getDb();

  const [
    fiche,
    ledgerRows,
    dossiers,
    declarationRows,
    transactionTypes,
    canRecordLedger,
    hasOpeningBalance,
    activityLog,
    formSuggestions,
    customerSuggestions,
  ] = await Promise.all([
    getCustomerFiche(db, ctx, id),
    listLedgerEntriesForCustomer(db, ctx, id),
    listDossiersForCustomer(db, ctx, id),
    listDeclarationsForCustomer(db, ctx, id),
    listTransactionTypes(db, ctx),
    memberHasRole(auth.userId, auth.organizationId, LEDGER_MUTATION_ROLES),
    customerHasOpeningBalance(db, ctx.organizationId, id),
    listActivityForCustomer(db, ctx, id),
    getOrgFormSuggestions(db, ctx),
    getCustomerFormSuggestions(db, ctx, id),
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
        : tabParam === "activite"
          ? ("activite" as const)
          : undefined;

  return (
    <OrgFormSuggestionsProvider suggestions={formSuggestions}>
      <div className="space-y-6">
        <p className="text-sm text-muted-foreground">
          <Link href="/clients" className="hover:underline">
            ← Clients
          </Link>
        </p>

        <Suspense fallback={<p className="text-sm text-muted-foreground">Chargement…</p>}>
          <CustomerFicheView
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
            hasOpeningBalance={hasOpeningBalance}
            activityLog={serializeActivityLog(activityLog)}
            initialTab={initialTab}
            customerLedgerLabels={customerSuggestions.ledgerLabels}
          />
        </Suspense>
      </div>
    </OrgFormSuggestionsProvider>
  );
}
