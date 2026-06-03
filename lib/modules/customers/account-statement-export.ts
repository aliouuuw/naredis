import {
  formatBalanceStatement,
  formatXof,
} from "@/lib/domain/balance";
import { formatExportGeneratedAt, workbookToBuffer } from "@/lib/modules/excel/workbook";
import {
  buildAccountLedger,
  formatRunningBalanceLabel,
  type AccountLedgerDayGroup,
  type AccountLedgerRow,
} from "@/lib/modules/customers/account-ledger";
import type { DeclarationListItemSerialized } from "@/lib/modules/declarations/serialize-list";
import type { LedgerEntrySerialized } from "@/lib/modules/ledger/serialize";
import * as XLSX from "xlsx";

export type AccountStatementMeta = {
  organizationName: string;
  customerName: string;
  customerSlug: string;
  customerPhone: string | null;
  currentBalanceLabel: string;
  dayOpenBalanceLabel: string;
  feesAllTimeXof: string;
  transactionsTodayXof: string;
  generatedAtLabel: string;
};

/** Chronological order (oldest first) for statement export. */
export function flattenAccountLedgerForExport(
  groups: AccountLedgerDayGroup[],
): AccountLedgerRow[] {
  return groups
    .slice()
    .reverse()
    .flatMap((group) => [...group.rows].reverse());
}

export function buildAccountStatementWorkbook(
  meta: AccountStatementMeta,
  ledgerEntries: LedgerEntrySerialized[],
  declarations: DeclarationListItemSerialized[],
): XLSX.WorkBook {
  const groups = buildAccountLedger(ledgerEntries, declarations);
  const rows = flattenAccountLedgerForExport(groups);

  const header: (string | number)[][] = [
    ["Relevé de compte"],
    [meta.organizationName],
    [],
    ["Client", meta.customerName],
    ["Identifiant", meta.customerSlug],
    ["Téléphone", meta.customerPhone ?? "—"],
    ["Solde courant", meta.currentBalanceLabel],
    ["Report du jour", meta.dayOpenBalanceLabel],
    ["Frais dossiers (cumul)", `${meta.feesAllTimeXof} XOF`],
    ["Transactions du jour", `${meta.transactionsTodayXof} XOF`],
    ["Édité le", meta.generatedAtLabel],
    [],
    ["Date", "Libellé", "Détail", "Liens", "Débit (XOF)", "Crédit (XOF)", "Solde après ligne"],
  ];

  const body = rows.map((row) => [
    row.dateDisplay,
    row.label,
    row.detail ?? "",
    row.links.map((l) => l.label).join(" · "),
    row.debitDisplay ?? "",
    row.creditDisplay ?? "",
    formatRunningBalanceLabel(row),
  ]);

  const sheet = XLSX.utils.aoa_to_sheet([...header, ...body]);

  const colWidths = [
    { wch: 12 },
    { wch: 28 },
    { wch: 36 },
    { wch: 32 },
    { wch: 14 },
    { wch: 14 },
    { wch: 22 },
  ];
  sheet["!cols"] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Relevé");
  return workbook;
}

export function accountStatementWorkbookToBuffer(workbook: XLSX.WorkBook): Buffer {
  return workbookToBuffer(workbook);
}

export function accountStatementFilename(slug: string, dayKey: string): string {
  const safe = slug.replace(/[^a-z0-9-]+/gi, "-").replace(/-+/g, "-");
  return `releve-${safe}-${dayKey}.xlsx`;
}

export function buildAccountStatementMeta(input: {
  organizationName: string;
  customerName: string;
  customerSlug: string;
  customerPhone: string | null;
  balance: { amount: bigint; side: "debit" | "credit" };
  dayOpenBalance: { amount: bigint; side: "debit" | "credit" };
  feesAllTime: bigint;
  transactionsToday: bigint;
  generatedAt?: Date;
}): AccountStatementMeta {
  return {
    organizationName: input.organizationName,
    customerName: input.customerName,
    customerSlug: input.customerSlug,
    customerPhone: input.customerPhone,
    currentBalanceLabel: formatBalanceStatement(input.balance),
    dayOpenBalanceLabel: formatBalanceStatement(input.dayOpenBalance),
    feesAllTimeXof: formatXof(input.feesAllTime),
    transactionsTodayXof: formatXof(input.transactionsToday),
    generatedAtLabel: formatExportGeneratedAt(input.generatedAt),
  };
}
