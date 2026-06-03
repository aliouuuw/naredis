import { getDb } from "@/lib/db";
import { getAuthContext } from "@/lib/auth/session";
import { toModuleContext } from "@/lib/auth/module-context";
import { agencyCalendarDate } from "@/lib/domain/timezone";
import { excelDownloadResponse } from "@/lib/modules/excel/workbook";
import { listDeclarationsForCustomer } from "@/lib/modules/declarations/service";
import { serializeDeclarationListItem } from "@/lib/modules/declarations/serialize-list";
import { listLedgerEntriesForCustomer } from "@/lib/modules/ledger/service";
import { serializeLedgerEntry } from "@/lib/modules/ledger/serialize";
import {
  accountStatementFilename,
  accountStatementWorkbookToBuffer,
  buildAccountStatementMeta,
  buildAccountStatementWorkbook,
} from "@/lib/modules/customers/account-statement-export";
import { getCustomerFiche } from "@/lib/modules/customers/service";
import { getOrganizationName } from "@/lib/modules/organizations/org-name";

export async function GET(
  _request: Request,
  context: { params: Promise<{ customerId: string }> },
) {
  const auth = await getAuthContext();
  if (!auth) {
    return new Response("Non autorisé", { status: 401 });
  }

  const { customerId } = await context.params;
  const ctx = toModuleContext(auth);
  const db = getDb();

  const [fiche, ledgerRows, declarationRows, orgRow] = await Promise.all([
    getCustomerFiche(db, ctx, customerId),
    listLedgerEntriesForCustomer(db, ctx, customerId),
    listDeclarationsForCustomer(db, ctx, customerId),
    getOrganizationName(db, ctx.organizationId),
  ]);

  if (!fiche) {
    return new Response("Client introuvable", { status: 404 });
  }

  const { customer, balance, dayOpenBalance, feesAllTime, transactionsToday } =
    fiche;

  const meta = buildAccountStatementMeta({
    organizationName: orgRow,
    customerName: customer.name,
    customerSlug: customer.slug,
    customerPhone: customer.phone,
    balance,
    dayOpenBalance,
    feesAllTime,
    transactionsToday,
  });

  const workbook = buildAccountStatementWorkbook(
    meta,
    ledgerRows.map(serializeLedgerEntry),
    declarationRows.map(serializeDeclarationListItem),
  );

  const buffer = accountStatementWorkbookToBuffer(workbook);
  const filename = accountStatementFilename(customer.slug, agencyCalendarDate());

  return excelDownloadResponse(buffer, filename);
}
