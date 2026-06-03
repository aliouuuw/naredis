import { formatXof } from "@/lib/domain/balance";
import { computeDeclarationReste } from "@/lib/domain/declaration-reste";
import {
  formatExportGeneratedAt,
  workbookToBuffer,
} from "@/lib/modules/excel/workbook";
import type { DeclarationListItemSerialized } from "./serialize-list";
import * as XLSX from "xlsx";

export type DeclarationsExportMeta = {
  organizationName: string;
  title: string;
  filterSummary: string;
  rowCount: number;
  generatedAtLabel: string;
};

function formatDeclarationDate(value: string | null): string {
  if (!value) return "";
  return new Intl.DateTimeFormat("fr-FR").format(new Date(value));
}

function formatMoney(value: string | null): string {
  if (value == null) return "";
  return formatXof(BigInt(value));
}

function formatReste(
  clientAmountPaid: string | null,
  costPrice: string | null,
): string {
  const reste = computeDeclarationReste(
    clientAmountPaid != null ? BigInt(clientAmountPaid) : null,
    costPrice != null ? BigInt(costPrice) : null,
  );
  if (reste == null) return "";
  return formatXof(reste);
}

export function buildDeclarationsExportWorkbook(
  meta: DeclarationsExportMeta,
  rows: DeclarationListItemSerialized[],
): XLSX.WorkBook {
  const header: (string | number)[][] = [
    [meta.title],
    [meta.organizationName],
    ["Filtres", meta.filterSummary],
    ["Lignes exportées", meta.rowCount],
    ["Édité le", meta.generatedAtLabel],
    [],
    [
      "N° déclaration",
      "Client",
      "Slug client",
      "N° dossier",
      "BL",
      "Zone",
      "Date",
      "Nb conteneurs",
      "N° conteneurs",
      "Montant client (XOF)",
      "GAINDE (XOF)",
      "Prix de revient (XOF)",
      "Reste (XOF)",
      "Maison-mère",
      "BAD",
    ],
  ];

  const body = rows.map((row) => [
    row.declarationNumber,
    row.customerName,
    row.customerSlug,
    row.dossierNumber,
    row.blReference ?? "",
    row.zoneOrTerminal ?? "",
    formatDeclarationDate(row.declarationDate),
    row.containerCount != null && row.containerCount > 0
      ? row.containerCount
      : "",
    row.containers.join("; "),
    formatMoney(row.clientAmountPaid),
    formatMoney(row.gaindeDutyAmount),
    formatMoney(row.costPrice),
    formatReste(row.clientAmountPaid, row.costPrice),
    row.payingAgencyName ?? "",
    row.bonADelivrer ? "Oui" : "Non",
  ]);

  const sheet = XLSX.utils.aoa_to_sheet([...header, ...body]);
  sheet["!cols"] = [
    { wch: 18 },
    { wch: 24 },
    { wch: 14 },
    { wch: 14 },
    { wch: 18 },
    { wch: 10 },
    { wch: 12 },
    { wch: 10 },
    { wch: 28 },
    { wch: 16 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 18 },
    { wch: 6 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Déclarations");
  return workbook;
}

export function declarationsExportToBuffer(
  meta: DeclarationsExportMeta,
  rows: DeclarationListItemSerialized[],
): Buffer {
  return workbookToBuffer(buildDeclarationsExportWorkbook(meta, rows));
}

export function buildDeclarationsExportMeta(input: {
  organizationName: string;
  filterSummary: string;
  rowCount: number;
  generatedAt?: Date;
}): DeclarationsExportMeta {
  return {
    organizationName: input.organizationName,
    title: "Export déclarations",
    filterSummary: input.filterSummary,
    rowCount: input.rowCount,
    generatedAtLabel: formatExportGeneratedAt(input.generatedAt),
  };
}

export function declarationsExportFilename(dayKey: string): string {
  return `declarations-${dayKey}.xlsx`;
}
