import { formatXof } from "@/lib/domain/balance";
import type { BalanceSide } from "@/lib/db/enums";
import {
  formatExportGeneratedAt,
  workbookToBuffer,
} from "@/lib/modules/excel/workbook";
import type { LedgerEntrySerialized } from "./serialize";
import * as XLSX from "xlsx";

export type TransactionsExportMeta = {
  organizationName: string;
  title: string;
  filterSummary: string;
  rowCount: number;
  generatedAtLabel: string;
};

function formatDebitCredit(amount: bigint, side: BalanceSide) {
  const formatted = formatXof(amount);
  if (side === "debit") {
    return { debit: formatted, credit: "" };
  }
  return { debit: "", credit: formatted };
}

function formatLinks(row: LedgerEntrySerialized): string {
  if (row.allocations.length > 0) {
    return row.allocations
      .map((a) => {
        const bl = a.blReference ? ` · BL ${a.blReference}` : "";
        return `${a.dossierNumber}${bl}`;
      })
      .join(" ; ");
  }
  if (row.dossierNumber) return row.dossierNumber;
  return "";
}

export function buildTransactionsExportWorkbook(
  meta: TransactionsExportMeta,
  rows: LedgerEntrySerialized[],
): XLSX.WorkBook {
  const header: (string | number)[][] = [
    [meta.title],
    [meta.organizationName],
    ["Filtres", meta.filterSummary],
    ["Lignes exportées", meta.rowCount],
    ["Édité le", meta.generatedAtLabel],
    [],
    [
      "Date",
      "Client",
      "Libellé",
      "Type",
      "Débit (XOF)",
      "Crédit (XOF)",
      "Liens dossier",
      "Notes",
    ],
  ];

  const body = rows.map((row) => {
    const amount = BigInt(row.amount);
    const { debit, credit } = formatDebitCredit(amount, row.balanceSide);
    return [
      row.effectiveDate,
      row.customerName,
      row.label,
      row.transactionTypeName,
      debit,
      credit,
      formatLinks(row),
      row.notes ?? "",
    ];
  });

  const sheet = XLSX.utils.aoa_to_sheet([...header, ...body]);
  sheet["!cols"] = [
    { wch: 12 },
    { wch: 22 },
    { wch: 28 },
    { wch: 18 },
    { wch: 14 },
    { wch: 14 },
    { wch: 24 },
    { wch: 20 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Transactions");
  return workbook;
}

export function transactionsExportToBuffer(
  meta: TransactionsExportMeta,
  rows: LedgerEntrySerialized[],
): Buffer {
  return workbookToBuffer(buildTransactionsExportWorkbook(meta, rows));
}

export function buildTransactionsExportMeta(input: {
  organizationName: string;
  filterSummary: string;
  rowCount: number;
  generatedAt?: Date;
}): TransactionsExportMeta {
  return {
    organizationName: input.organizationName,
    title: "Export transactions",
    filterSummary: input.filterSummary,
    rowCount: input.rowCount,
    generatedAtLabel: formatExportGeneratedAt(input.generatedAt),
  };
}

export function transactionsExportFilename(dayKey: string): string {
  return `transactions-${dayKey}.xlsx`;
}
