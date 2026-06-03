import { and, desc, eq, ne, sql } from "drizzle-orm";
import type { DbLike } from "@/lib/db";
import { customers, declarations, documents, dossiers } from "@/lib/db/schema";
import { computeDeclarationReste } from "@/lib/domain/declaration-reste";
import { listActivityForDossier } from "@/lib/modules/activity/service";
import { listLedgerEntriesForOrganization } from "@/lib/modules/ledger/service";
import type { LedgerEntryListItem } from "@/lib/modules/ledger/service";
import type { ModuleContext } from "@/lib/modules/shared/types";
import { computeDossierLedgerSummary } from "./finances";
import { getDossierById } from "./service";

export type DossierDeclarationRow = {
  id: string;
  declarationNumber: string;
  declarationDate: string | null;
  bonADelivrer: boolean;
  clientAmountPaid: bigint | null;
  costPrice: bigint | null;
};

export type DossierDocumentRow = {
  id: string;
  fileName: string;
  documentType: string;
  mimeType: string | null;
  sizeBytes: bigint | null;
  createdAt: Date;
};

export type DossierHubData = {
  dossier: {
    id: string;
    dossierNumber: string;
    blReference: string | null;
    caseStatus: "open" | "on_hold" | "closed";
    dossierType: string;
    customer: { id: string; name: string; slug: string };
  };
  declarations: DossierDeclarationRow[];
  documents: DossierDocumentRow[];
  finances: {
    filing: {
      totalClientAmount: bigint;
      totalCostPrice: bigint;
      reste: bigint;
    };
    ledger: ReturnType<typeof computeDossierLedgerSummary>;
    ledgerEntries: LedgerEntryListItem[];
  };
  activity: Awaited<ReturnType<typeof listActivityForDossier>>;
  closeWarnings: string[];
};

export async function getDossierHub(
  db: DbLike,
  ctx: ModuleContext,
  dossierId: string,
): Promise<DossierHubData | null> {
  const dossier = await getDossierById(db, ctx, dossierId);
  if (!dossier) return null;

  const [customer] = await db
    .select({ id: customers.id, name: customers.name, slug: customers.slug })
    .from(customers)
    .where(eq(customers.id, dossier.customerId))
    .limit(1);

  if (!customer) return null;

  const [filingRows, docRows, ledgerEntries, activity] = await Promise.all([
    db
      .select({
        id: declarations.id,
        declarationNumber: declarations.declarationNumber,
        declarationDate: declarations.declarationDate,
        bonADelivrer: declarations.bonADelivrer,
        clientAmountPaid: declarations.clientAmountPaid,
        costPrice: declarations.costPrice,
      })
      .from(declarations)
      .where(
        and(
          eq(declarations.dossierId, dossierId),
          eq(declarations.organizationId, ctx.organizationId),
        ),
      )
      .orderBy(desc(declarations.declarationDate)),
    db
      .select({
        id: documents.id,
        fileName: documents.fileName,
        documentType: documents.documentType,
        mimeType: documents.mimeType,
        sizeBytes: documents.sizeBytes,
        createdAt: documents.createdAt,
      })
      .from(documents)
      .where(
        and(
          eq(documents.dossierId, dossierId),
          eq(documents.organizationId, ctx.organizationId),
        ),
      )
      .orderBy(desc(documents.createdAt)),
    listLedgerEntriesForOrganization(db, ctx, { dossierId }),
    listActivityForDossier(db, ctx, dossierId),
  ]);

  const ledgerSummary = computeDossierLedgerSummary(ledgerEntries, dossierId);

  let totalClientAmount = BigInt(0);
  let totalCostPrice = BigInt(0);
  for (const row of filingRows) {
    if (row.clientAmountPaid != null) {
      totalClientAmount += row.clientAmountPaid;
    }
    if (row.costPrice != null) {
      totalCostPrice += row.costPrice;
    }
  }

  const reste =
    computeDeclarationReste(totalClientAmount, totalCostPrice) ?? BigInt(0);

  const closeWarnings: string[] = [];
  if (dossier.caseStatus !== "closed") {
    const sansBad = filingRows.filter((r) => !r.bonADelivrer);
    if (sansBad.length > 0) {
      closeWarnings.push(
        `${sansBad.length} déclaration(s) sans bon à délivrer : ${sansBad.map((r) => r.declarationNumber).join(", ")}`,
      );
    }
    if (filingRows.length === 0) {
      closeWarnings.push("Ce dossier n'a aucune déclaration enregistrée.");
    }
  }

  return {
    dossier: {
      id: dossier.id,
      dossierNumber: dossier.dossierNumber,
      blReference: dossier.blReference,
      caseStatus: dossier.caseStatus,
      dossierType: dossier.dossierType,
      customer,
    },
    declarations: filingRows.map((r) => ({
      ...r,
      declarationDate: r.declarationDate ?? null,
    })),
    documents: docRows,
    finances: {
      filing: {
        totalClientAmount,
        totalCostPrice,
        reste,
      },
      ledger: ledgerSummary,
      ledgerEntries,
    },
    activity,
    closeWarnings,
  };
}

export async function countOpenDossiers(
  db: DbLike,
  organizationId: string,
): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(dossiers)
    .where(
      and(
        eq(dossiers.organizationId, organizationId),
        ne(dossiers.caseStatus, "closed"),
      ),
    );
  return row?.count ?? 0;
}
