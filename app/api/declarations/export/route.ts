import { getDb } from "@/lib/db";
import { getAuthContext } from "@/lib/auth/session";
import { toModuleContext } from "@/lib/auth/module-context";
import { agencyCalendarDate } from "@/lib/domain/timezone";
import { excelDownloadResponse } from "@/lib/modules/excel/workbook";
import {
  buildDeclarationsExportMeta,
  declarationsExportFilename,
  declarationsExportToBuffer,
} from "@/lib/modules/declarations/declarations-export";
import {
  formatDeclarationsFilterSummary,
  parseDeclarationsViewState,
  sortDeclarationRows,
  viewStateToListFilters,
} from "@/lib/modules/declarations/declarations-query";
import { serializeDeclarationListItem } from "@/lib/modules/declarations/serialize-list";
import { listDeclarations } from "@/lib/modules/declarations/service";
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

  const viewState = parseDeclarationsViewState(params, today);
  const filters = viewStateToListFilters(viewState);

  const [rows, organizationName] = await Promise.all([
    listDeclarations(db, ctx, filters).then((items) =>
      items.map(serializeDeclarationListItem),
    ),
    getOrganizationName(db, ctx.organizationId),
  ]);

  const sorted = sortDeclarationRows(rows, viewState.sort);
  const meta = buildDeclarationsExportMeta({
    organizationName,
    filterSummary: formatDeclarationsFilterSummary(viewState),
    rowCount: sorted.length,
  });

  const buffer = declarationsExportToBuffer(meta, sorted);
  return excelDownloadResponse(buffer, declarationsExportFilename(today));
}
