import type { ActivityLogItem } from "@/lib/modules/activity/service";
import type { ActivityLogEntrySerialized } from "@/lib/modules/declarations/serialize-fiche";
import { serializeLedgerEntry } from "@/lib/modules/ledger/serialize";
import type { LedgerEntrySerialized } from "@/lib/modules/ledger/serialize";
import type { DossierHubData } from "./hub";

export type DossierHubSerialized = {
  dossier: DossierHubData["dossier"];
  declarations: Array<{
    id: string;
    declarationNumber: string;
    declarationDate: string | null;
    bonADelivrer: boolean;
    clientAmountPaid: string | null;
    costPrice: string | null;
  }>;
  documents: Array<{
    id: string;
    fileName: string;
    documentType: string;
    mimeType: string | null;
    sizeBytes: string | null;
    createdAt: string;
  }>;
  finances: {
    filing: {
      totalClientAmount: string;
      totalCostPrice: string;
      reste: string;
    };
    ledger: {
      charges: string;
      paye: string;
      reste: string;
      surplus: string;
    };
    ledgerEntries: LedgerEntrySerialized[];
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
    declarations: hub.declarations.map((d) => ({
      id: d.id,
      declarationNumber: d.declarationNumber,
      declarationDate: d.declarationDate,
      bonADelivrer: d.bonADelivrer,
      clientAmountPaid: d.clientAmountPaid?.toString() ?? null,
      costPrice: d.costPrice?.toString() ?? null,
    })),
    documents: hub.documents.map((d) => ({
      id: d.id,
      fileName: d.fileName,
      documentType: d.documentType,
      mimeType: d.mimeType,
      sizeBytes: d.sizeBytes?.toString() ?? null,
      createdAt: d.createdAt.toISOString(),
    })),
    finances: {
      filing: {
        totalClientAmount: hub.finances.filing.totalClientAmount.toString(),
        totalCostPrice: hub.finances.filing.totalCostPrice.toString(),
        reste: hub.finances.filing.reste.toString(),
      },
      ledger: {
        charges: hub.finances.ledger.charges.toString(),
        paye: hub.finances.ledger.paye.toString(),
        reste: hub.finances.ledger.reste.toString(),
        surplus: hub.finances.ledger.surplus.toString(),
      },
      ledgerEntries: hub.finances.ledgerEntries.map(serializeLedgerEntry),
    },
    activity: serializeActivityLog(hub.activity),
    closeWarnings: hub.closeWarnings,
  };
}
