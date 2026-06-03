import { AGENCY_TIMEZONE } from "@/lib/domain/timezone";
import * as XLSX from "xlsx";

export function formatExportGeneratedAt(date: Date = new Date()): string {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: AGENCY_TIMEZONE,
  }).format(date);
}

export function workbookToBuffer(workbook: XLSX.WorkBook): Buffer {
  const arrayBuffer = XLSX.write(workbook, {
    type: "array",
    bookType: "xlsx",
  }) as ArrayBuffer;
  return Buffer.from(arrayBuffer);
}

export function excelDownloadResponse(
  buffer: Buffer,
  filename: string,
): Response {
  return new Response(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

export function safeExportFilename(prefix: string, dayKey: string): string {
  const safe = prefix.replace(/[^a-z0-9-]+/gi, "-").replace(/-+/g, "-");
  return `${safe}-${dayKey}.xlsx`;
}
