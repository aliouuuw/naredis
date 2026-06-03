import { and, desc, eq } from "drizzle-orm";
import type { DbLike } from "@/lib/db";
import type { CaseStatus, DossierType } from "@/lib/db/enums";
import { customers, dossiers } from "@/lib/db/schema";
import type { ModuleContext } from "@/lib/modules/shared/types";
import { nextDossierNumber } from "./sequences";

export type CreateDossierInput = {
  customerId: string;
  dossierType?: DossierType;
  blReference?: string | null;
  title?: string | null;
  description?: string | null;
};

export type DossierListItem = {
  id: string;
  dossierNumber: string;
  blReference: string | null;
  caseStatus: CaseStatus;
  customerId: string;
  customerName: string;
};

export async function listDossiers(
  db: DbLike,
  ctx: ModuleContext,
  limit = 200,
): Promise<DossierListItem[]> {
  return db
    .select({
      id: dossiers.id,
      dossierNumber: dossiers.dossierNumber,
      blReference: dossiers.blReference,
      caseStatus: dossiers.caseStatus,
      customerId: customers.id,
      customerName: customers.name,
    })
    .from(dossiers)
    .innerJoin(customers, eq(dossiers.customerId, customers.id))
    .where(eq(dossiers.organizationId, ctx.organizationId))
    .orderBy(desc(dossiers.updatedAt))
    .limit(limit);
}

export async function getDossierById(
  db: DbLike,
  ctx: ModuleContext,
  dossierId: string,
) {
  const [row] = await db
    .select()
    .from(dossiers)
    .where(
      and(
        eq(dossiers.id, dossierId),
        eq(dossiers.organizationId, ctx.organizationId),
      ),
    )
    .limit(1);
  return row ?? null;
}

export async function createDossier(
  db: DbLike,
  ctx: ModuleContext,
  input: CreateDossierInput,
) {
  const dossierNumber = await nextDossierNumber(db, ctx.organizationId);

  const [row] = await db
    .insert(dossiers)
    .values({
      organizationId: ctx.organizationId,
      customerId: input.customerId,
      dossierNumber,
      dossierType: input.dossierType ?? "import",
      blReference: input.blReference ?? null,
      title: input.title ?? null,
      description: input.description ?? null,
    })
    .returning();

  return row;
}

export async function updateDossierCaseStatus(
  db: DbLike,
  ctx: ModuleContext,
  dossierId: string,
  caseStatus: CaseStatus,
) {
  const [row] = await db
    .update(dossiers)
    .set({
      caseStatus,
      closedAt: caseStatus === "closed" ? new Date() : null,
    })
    .where(
      and(
        eq(dossiers.id, dossierId),
        eq(dossiers.organizationId, ctx.organizationId),
      ),
    )
    .returning();
  return row ?? null;
}

export async function updateDossierBlReference(
  db: DbLike,
  ctx: ModuleContext,
  dossierId: string,
  blReference: string | null,
) {
  const [row] = await db
    .update(dossiers)
    .set({ blReference })
    .where(
      and(
        eq(dossiers.id, dossierId),
        eq(dossiers.organizationId, ctx.organizationId),
      ),
    )
    .returning();
  return row ?? null;
}
