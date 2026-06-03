import { getDb } from "@/lib/db";
import { getAuthContext } from "@/lib/auth/session";
import { toModuleContext } from "@/lib/auth/module-context";
import { agencyCalendarDate } from "@/lib/domain/timezone";
import { excelDownloadResponse } from "@/lib/modules/excel/workbook";
import {
  buildTransactionsExportMeta,
  transactionsExportFilename,
  transactionsExportToBuffer,
} from "@/lib/modules/ledger/transactions-export";
import { serializeLedgerEntry } from "@/lib/modules/ledger/serialize";
import { listLedgerEntriesForOrganization } from "@/lib/modules/ledger/service";
import {
  formatViewSummary,
  parseTransactionsViewState,
  rulesToLedgerFilters,
  sortLedgerRows,
} from "@/lib/modules/ledger/transactions-query";
import { getOrganizationName } from "@/lib/modules/organizations/org-name";
import { searchParamsToRecord } from "@/lib/ui/list-export-query";

export async function GET(request: Request) {
  const auth = await getAuthContext();
  if (!auth) {
    return new Response("Non autorisé", { status: 401 });
  }

  const url = new URL(request.url);
  const params = searchParamsToRecord(url.searchParams);
  const today = agencyCalendarDate();
  const ctx = toModuleContext(auth);
  const db = getDb();

  const viewState = parseTransactionsViewState(params, today);
  const ledgerFilters = rulesToLedgerFilters(
    viewState.rules,
    viewState.dateFrom,
    viewState.dateTo,
  );

  const [entries, organizationName] = await Promise.all([
    listLedgerEntriesForOrganization(db, ctx, ledgerFilters),
    getOrganizationName(db, ctx.organizationId),
  ]);

  const serialized = entries.map(serializeLedgerEntry);
  const sorted = sortLedgerRows(serialized, viewState.sort);

  const meta = buildTransactionsExportMeta({
    organizationName,
    filterSummary: formatViewSummary(viewState, sorted.length),
    rowCount: sorted.length,
  });

  const buffer = transactionsExportToBuffer(meta, sorted);
  return excelDownloadResponse(buffer, transactionsExportFilename(today));
}
