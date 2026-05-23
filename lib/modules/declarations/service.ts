import { and, desc, eq } from "drizzle-orm";
import type { DbLike } from "@/lib/db";
import { getBonADelivrerMissingFields } from "@/lib/domain/declaration-completion";
import {
  customers,
  declarationContainers,
  declarationEditLog,
  declarations,
  dossiers,
  organizationAgencies,
} from "@/lib/db/schema";
import { appendActivity } from "@/lib/modules/activity/append-activity";
import { createDossier, getDossierById, updateDossierBlReference } from "@/lib/modules/dossiers/service";
import { nextDeclarationNumber } from "@/lib/modules/dossiers/sequences";
import type { ModuleContext } from "@/lib/modules/shared/types";
import type { CreateDeclarationInput, UpdateDeclarationInput } from "./schemas";

export type DeclarationListItem = {
  id: string;
  declarationNumber: string;
  zoneOrTerminal: string | null;
  declarationDate: string | null;
  blReference: string | null;
  customerName: string;
  customerSlug: string;
  containerCount: number | null;
  clientAmountPaid: bigint | null;
  gaindeDutyAmount: bigint | null;
  costPrice: bigint | null;
  bonADelivrer: boolean;
  payingAgencyName: string | null;
  dossierId: string;
};

function serializeValue(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value === "bigint") return value.toString();
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

function buildFieldChanges(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
): Record<string, { from: string | null; to: string | null }> {
  const changes: Record<string, { from: string | null; to: string | null }> = {};
  for (const key of Object.keys(after)) {
    const from = serializeValue(before[key]);
    const to = serializeValue(after[key]);
    if (from !== to) {
      changes[key] = { from, to };
    }
  }
  return changes;
}

async function syncContainers(
  db: DbLike,
  ctx: ModuleContext,
  declarationId: string,
  containers: string[],
) {
  await db
    .delete(declarationContainers)
    .where(eq(declarationContainers.declarationId, declarationId));

  const trimmed = containers.map((c) => c.trim()).filter(Boolean);
  if (trimmed.length === 0) return;

  await db.insert(declarationContainers).values(
    trimmed.map((containerNumber, index) => ({
      organizationId: ctx.organizationId,
      declarationId,
      containerNumber,
      sortOrder: index,
    })),
  );
}

async function loadContainers(db: DbLike, declarationId: string): Promise<string[]> {
  const rows = await db
    .select({ containerNumber: declarationContainers.containerNumber })
    .from(declarationContainers)
    .where(eq(declarationContainers.declarationId, declarationId))
    .orderBy(declarationContainers.sortOrder);
  return rows.map((r) => r.containerNumber);
}

export async function listDeclarations(
  db: DbLike,
  ctx: ModuleContext,
  limit = 50,
): Promise<DeclarationListItem[]> {
  const rows = await db
    .select({
      id: declarations.id,
      declarationNumber: declarations.declarationNumber,
      zoneOrTerminal: declarations.zoneOrTerminal,
      declarationDate: declarations.declarationDate,
      containerCount: declarations.containerCount,
      clientAmountPaid: declarations.clientAmountPaid,
      gaindeDutyAmount: declarations.gaindeDutyAmount,
      costPrice: declarations.costPrice,
      bonADelivrer: declarations.bonADelivrer,
      dossierId: declarations.dossierId,
      blReference: dossiers.blReference,
      customerName: customers.name,
      customerSlug: customers.slug,
      payingAgencyName: organizationAgencies.name,
    })
    .from(declarations)
    .innerJoin(dossiers, eq(declarations.dossierId, dossiers.id))
    .innerJoin(customers, eq(dossiers.customerId, customers.id))
    .leftJoin(
      organizationAgencies,
      eq(declarations.payingAgencyId, organizationAgencies.id),
    )
    .where(eq(declarations.organizationId, ctx.organizationId))
    .orderBy(desc(declarations.updatedAt))
    .limit(limit);

  return rows.map((r) => ({
    ...r,
    declarationDate: r.declarationDate ?? null,
  }));
}

export async function getDeclarationById(
  db: DbLike,
  ctx: ModuleContext,
  declarationId: string,
) {
  const [row] = await db
    .select({
      declaration: declarations,
      dossier: dossiers,
      customer: customers,
      payingAgencyName: organizationAgencies.name,
    })
    .from(declarations)
    .innerJoin(dossiers, eq(declarations.dossierId, dossiers.id))
    .innerJoin(customers, eq(dossiers.customerId, customers.id))
    .leftJoin(
      organizationAgencies,
      eq(declarations.payingAgencyId, organizationAgencies.id),
    )
    .where(
      and(
        eq(declarations.id, declarationId),
        eq(declarations.organizationId, ctx.organizationId),
      ),
    )
    .limit(1);

  if (!row) return null;

  const containers = await loadContainers(db, declarationId);
  return { ...row, containers };
}

export async function createDeclaration(
  db: DbLike,
  ctx: ModuleContext,
  input: CreateDeclarationInput,
) {
  return db.transaction(async (tx) => {
    const dossier = await createDossier(tx, ctx, {
      customerId: input.customerId,
      dossierType: input.dossierType,
      blReference: input.blReference,
      title: input.title,
    });

    const declarationNumber = await nextDeclarationNumber(
      tx,
      ctx.organizationId,
    );

    const containers = input.containers ?? [];
    const containerCount = input.containerCount ?? containers.length;

    const [declaration] = await tx
      .insert(declarations)
      .values({
        organizationId: ctx.organizationId,
        dossierId: dossier.id,
        declarationNumber,
        zoneOrTerminal: input.zoneOrTerminal?.trim() || null,
        declarationDate: input.declarationDate || null,
        containerCount,
        clientAmountPaid: input.clientAmountPaid ?? null,
        gaindeDutyAmount: input.gaindeDutyAmount ?? null,
        costPrice: input.costPrice ?? null,
        payingAgencyId: input.payingAgencyId ?? null,
      })
      .returning();

    await syncContainers(tx, ctx, declaration.id, containers);

    await appendActivity(tx, {
      organizationId: ctx.organizationId,
      entityType: "declaration",
      entityId: declaration.id,
      action: "declaration.created",
      payload: {
        declarationNumber,
        dossierId: dossier.id,
        blReference: input.blReference,
      },
      actorId: ctx.userId,
    });

    return { declaration, dossier };
  });
}

export async function updateDeclaration(
  db: DbLike,
  ctx: ModuleContext,
  declarationId: string,
  input: UpdateDeclarationInput,
) {
  const current = await getDeclarationById(db, ctx, declarationId);
  if (!current) return null;

  const { declaration, dossier, containers: existingContainers } = current;

  if (input.bonADelivrer === true) {
    const nextContainers =
      input.containers !== undefined ? input.containers : existingContainers;
    const nextCount =
      input.containerCount !== undefined && input.containerCount !== null
        ? input.containerCount
        : (declaration.containerCount ?? 0);
    const missing = getBonADelivrerMissingFields({
      zoneOrTerminal:
        input.zoneOrTerminal !== undefined
          ? input.zoneOrTerminal
          : declaration.zoneOrTerminal,
      declarationDate:
        input.declarationDate !== undefined
          ? input.declarationDate
          : declaration.declarationDate,
      blReference:
        input.blReference !== undefined ? input.blReference : dossier.blReference,
      containerCount: nextCount,
      containers: nextContainers,
      clientAmountPaid:
        input.clientAmountPaid !== undefined
          ? input.clientAmountPaid
          : declaration.clientAmountPaid,
      gaindeDutyAmount:
        input.gaindeDutyAmount !== undefined
          ? input.gaindeDutyAmount
          : declaration.gaindeDutyAmount,
      costPrice:
        input.costPrice !== undefined ? input.costPrice : declaration.costPrice,
    });
    if (missing.length > 0) {
      throw new Error(
        `Champs manquants pour bon à délivrer: ${missing.join(", ")}`,
      );
    }
  }

  const beforeSnapshot: Record<string, unknown> = {
    zone_or_terminal: declaration.zoneOrTerminal,
    declaration_date: declaration.declarationDate,
    container_count: declaration.containerCount,
    client_amount_paid: declaration.clientAmountPaid,
    gainde_duty_amount: declaration.gaindeDutyAmount,
    cost_price: declaration.costPrice,
    paying_agency_id: declaration.payingAgencyId,
    bl_reference: dossier.blReference,
    customs_reference: declaration.customsReference,
    bureau: declaration.bureau,
    bon_a_delivrer: declaration.bonADelivrer,
  };

  return db.transaction(async (tx) => {
    if (input.blReference !== undefined) {
      await updateDossierBlReference(
        tx,
        ctx,
        dossier.id,
        input.blReference?.trim() || null,
      );
    }

    const bonADelivrer =
      input.bonADelivrer !== undefined
        ? input.bonADelivrer
        : declaration.bonADelivrer;

    const [updated] = await tx
      .update(declarations)
      .set({
        zoneOrTerminal:
          input.zoneOrTerminal !== undefined
            ? input.zoneOrTerminal?.trim() || null
            : declaration.zoneOrTerminal,
        declarationDate:
          input.declarationDate !== undefined
            ? input.declarationDate
            : declaration.declarationDate,
        containerCount:
          input.containerCount !== undefined
            ? input.containerCount
            : declaration.containerCount,
        clientAmountPaid:
          input.clientAmountPaid !== undefined
            ? input.clientAmountPaid
            : declaration.clientAmountPaid,
        gaindeDutyAmount:
          input.gaindeDutyAmount !== undefined
            ? input.gaindeDutyAmount
            : declaration.gaindeDutyAmount,
        costPrice:
          input.costPrice !== undefined ? input.costPrice : declaration.costPrice,
        payingAgencyId:
          input.payingAgencyId !== undefined
            ? input.payingAgencyId
            : declaration.payingAgencyId,
        customsReference:
          input.customsReference !== undefined
            ? input.customsReference
            : declaration.customsReference,
        bureau: input.bureau !== undefined ? input.bureau : declaration.bureau,
        bonADelivrer,
        bonADelivrerAt:
          bonADelivrer && !declaration.bonADelivrer
            ? new Date()
            : bonADelivrer
              ? declaration.bonADelivrerAt
              : null,
        version: declaration.version + 1,
      })
      .where(
        and(
          eq(declarations.id, declarationId),
          eq(declarations.organizationId, ctx.organizationId),
        ),
      )
      .returning();

    if (input.containers !== undefined) {
      await syncContainers(tx, ctx, declarationId, input.containers);
    }

    const refreshedDossier = await getDossierById(tx, ctx, dossier.id);
    const refreshedContainers =
      input.containers !== undefined
        ? input.containers
        : await loadContainers(tx, declarationId);

    const afterSnapshot: Record<string, unknown> = {
      zone_or_terminal: updated.zoneOrTerminal,
      declaration_date: updated.declarationDate,
      container_count: updated.containerCount,
      client_amount_paid: updated.clientAmountPaid,
      gainde_duty_amount: updated.gaindeDutyAmount,
      cost_price: updated.costPrice,
      paying_agency_id: updated.payingAgencyId,
      bl_reference: refreshedDossier?.blReference ?? null,
      customs_reference: updated.customsReference,
      bureau: updated.bureau,
      bon_a_delivrer: updated.bonADelivrer,
    };

    const changes = buildFieldChanges(beforeSnapshot, afterSnapshot);
    if (Object.keys(changes).length > 0) {
      await tx.insert(declarationEditLog).values({
        organizationId: ctx.organizationId,
        declarationId,
        changes,
        changedBy: ctx.userId,
      });

      await appendActivity(tx, {
        organizationId: ctx.organizationId,
        entityType: "declaration",
        entityId: declarationId,
        action: "declaration.updated",
        payload: { changes: Object.keys(changes) },
        actorId: ctx.userId,
      });
    }

    return updated;
  });
}

export async function setBonADelivrer(
  db: DbLike,
  ctx: ModuleContext,
  declarationId: string,
  value: boolean,
) {
  return updateDeclaration(db, ctx, declarationId, { bonADelivrer: value });
}
