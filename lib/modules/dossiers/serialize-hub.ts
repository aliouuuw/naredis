import type { ActivityLogItem } from "@/lib/modules/activity/service";
import type { ActivityLogEntrySerialized } from "@/lib/modules/declarations/serialize-fiche";
import type { DossierHubData } from "./hub";

export type DossierHubSerialized = {
  dossier: DossierHubData["dossier"];
  declarations: Array<
    Omit<DossierHubData["declarations"][number], never>
  >;
  documents: Array<{
    id: string;
    fileName: string;
    documentType: string;
    mimeType: string | null;
    sizeBytes: string | null;
    createdAt: string;
  }>;
  finances: {
    totalClientAmount: string;
    totalCostPrice: string;
    reste: string;
    ledgerRows: Array<{
      id: string;
      label: string;
      effectiveDate: string;
      amount: string;
      balanceSide: "debit" | "credit";
      entryType: string;
    }>;
  };
  activity: ActivityLogEntrySerialized[];
  closeWarnings: string[];
};

export function serializeActivityLog(
  rows: ActivityLogItem[],
): ActivityLogEntrySerialized[] {
  return rows.map((row) => ({
    id: row.id,
    entityType: row.entityType,
    entityId: row.entityId,
    action: row.action,
    payload: row.payload,
    actorId: row.actorId,
    createdAt: row.createdAt.toISOString(),
  }));
}

export function serializeDossierHub(
  hub: DossierHubData,
): DossierHubSerialized {
  return {
    dossier: hub.dossier,
    declarations: hub.declarations,
    documents: hub.documents.map((d) => ({
      id: d.id,
      fileName: d.fileName,
      documentType: d.documentType,
      mimeType: d.mimeType,
      sizeBytes: d.sizeBytes?.toString() ?? null,
      createdAt: d.createdAt.toISOString(),
    })),
    finances: {
      totalClientAmount: hub.finances.totalClientAmount.toString(),
      totalCostPrice: hub.finances.totalCostPrice.toString(),
      reste: hub.finances.reste.toString(),
      ledgerRows: hub.finances.ledgerRows.map((r) => ({
        ...r,
        amount: r.amount.toString(),
      })),
    },
    activity: serializeActivityLog(hub.activity),
    closeWarnings: hub.closeWarnings,
  };
}
