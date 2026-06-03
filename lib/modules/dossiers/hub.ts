import { and, desc, eq, ne, sql } from "drizzle-orm";
import type { DbLike } from "@/lib/db";
import {
  customers,
  declarations,
  documents,
  dossiers,
  ledgerEntries,
  paymentAllocations,
} from "@/lib/db/schema";
import { computeDeclarationReste } from "@/lib/domain/declaration-reste";
import { listActivityForDossier } from "@/lib/modules/activity/service";
import type { ModuleContext } from "@/lib/modules/shared/types";
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

export type DossierLedgerRow = {
  id: string;
  label: string;
  effectiveDate: string;
  amount: bigint;
  balanceSide: "debit" | "credit";
  entryType: string;
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
    totalClientAmount: bigint;
    totalCostPrice: bigint;
    reste: bigint;
    ledgerRows: DossierLedgerRow[];
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

  const [filingRows, docRows, ledgerOnDossier, activity] = await Promise.all([
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
    db
      .select({
        id: ledgerEntries.id,
        label: ledgerEntries.label,
        effectiveDate: ledgerEntries.effectiveDate,
        amount: ledgerEntries.amount,
        balanceSide: ledgerEntries.balanceSide,
        entryType: ledgerEntries.entryType,
      })
      .from(ledgerEntries)
      .where(
        and(
          eq(ledgerEntries.dossierId, dossierId),
          eq(ledgerEntries.organizationId, ctx.organizationId),
        ),
      )
      .orderBy(desc(ledgerEntries.effectiveDate)),
    listActivityForDossier(db, ctx, dossierId),
  ]);

  const allocationRows = await db
    .select({
      id: ledgerEntries.id,
      label: ledgerEntries.label,
      effectiveDate: ledgerEntries.effectiveDate,
      amount: paymentAllocations.amount,
      balanceSide: ledgerEntries.balanceSide,
      entryType: ledgerEntries.entryType,
    })
    .from(paymentAllocations)
    .innerJoin(
      ledgerEntries,
      eq(paymentAllocations.ledgerEntryId, ledgerEntries.id),
    )
    .where(
      and(
        eq(paymentAllocations.dossierId, dossierId),
        eq(paymentAllocations.organizationId, ctx.organizationId),
      ),
    )
    .orderBy(desc(ledgerEntries.effectiveDate));

  const ledgerById = new Map<string, DossierLedgerRow>();
  for (const row of ledgerOnDossier) {
    ledgerById.set(row.id, row);
  }
  for (const row of allocationRows) {
    if (!ledgerById.has(row.id)) {
      ledgerById.set(row.id, {
        id: row.id,
        label: row.label,
        effectiveDate: row.effectiveDate,
        amount: row.amount,
        balanceSide: row.balanceSide,
        entryType: row.entryType,
      });
    }
  }

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
      totalClientAmount,
      totalCostPrice,
      reste,
      ledgerRows: [...ledgerById.values()].sort((a, b) =>
        b.effectiveDate.localeCompare(a.effectiveDate),
      ),
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
