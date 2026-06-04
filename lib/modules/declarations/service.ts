import { and, asc, count, desc, eq, gte, ilike, inArray, lte, or } from "drizzle-orm";
import type { DbLike } from "@/lib/db";
import { getBonADelivrerMissingFields } from "@/lib/domain/declaration-completion";
import {
  customers,
  declarationContainers,
  declarationEditLog,
  declarations,
  dossiers,
  ledgerEntries,
  organizationAgencies,
} from "@/lib/db/schema";
import { appendActivity } from "@/lib/modules/activity/append-activity";
import {
  assertAgencyInOrg,
  assertCustomerInOrg,
  isUniqueViolation,
} from "@/lib/modules/shared/org-refs";
import {
  createDossier,
  getDossierById,
  updateDossierBlReference,
} from "@/lib/modules/dossiers/service";
import { buildDeclarationNumber } from "@/lib/domain/declaration-number";
import type { ModuleContext } from "@/lib/modules/shared/types";
import type {
  CreateDeclarationInput,
  UpdateDeclarationInput,
} from "./schemas";

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
  dossierNumber: string;
  containers: string[];
  createdAt: Date;
};

export type DeclarationListFilters = {
  customerId?: string;
  zoneOrTerminal?: string;
  bonADelivrer?: boolean;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
};

function serializeValue(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value === "bigint") return value.toString();
  if (Array.isArray(value)) return JSON.stringify(value);
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
  if (trimmed.length === 0) return [];

  await db.insert(declarationContainers).values(
    trimmed.map((containerNumber, index) => ({
      organizationId: ctx.organizationId,
      declarationId,
      containerNumber,
      sortOrder: index,
    })),
  );
  return trimmed;
}

async function loadContainers(
  db: DbLike,
  declarationId: string,
): Promise<string[]> {
  const rows = await db
    .select({ containerNumber: declarationContainers.containerNumber })
    .from(declarationContainers)
    .where(eq(declarationContainers.declarationId, declarationId))
    .orderBy(declarationContainers.sortOrder);
  return rows.map((r) => r.containerNumber);
}

async function loadContainersByDeclarationIds(
  db: DbLike,
  declarationIds: string[],
): Promise<Map<string, string[]>> {
  if (declarationIds.length === 0) return new Map();

  const rows = await db
    .select({
      declarationId: declarationContainers.declarationId,
      containerNumber: declarationContainers.containerNumber,
    })
    .from(declarationContainers)
    .where(inArray(declarationContainers.declarationId, declarationIds))
    .orderBy(
      asc(declarationContainers.declarationId),
      asc(declarationContainers.sortOrder),
    );

  const map = new Map<string, string[]>();
  for (const row of rows) {
    const list = map.get(row.declarationId) ?? [];
    list.push(row.containerNumber);
    map.set(row.declarationId, list);
  }
  return map;
}

/** Error subclasses so server actions can map to French messages. */
export class DuplicateBlError extends Error {
  constructor(public readonly blReference: string) {
    super(`Un dossier existe déjà avec le BL ${blReference}.`);
    this.name = "DuplicateBlError";
  }
}

export class DuplicateDeclarationNumberError extends Error {
  constructor(public readonly declarationNumber: string) {
    super(`Le numéro de déclaration ${declarationNumber} existe déjà.`);
    this.name = "DuplicateDeclarationNumberError";
  }
}

export class BonADelivrerIncompleteError extends Error {
  constructor(public readonly missing: string[]) {
    super(`Champs manquants pour bon à délivrer: ${missing.join(", ")}`);
    this.name = "BonADelivrerIncompleteError";
  }
}

async function findDossierByBl(
  db: DbLike,
  ctx: ModuleContext,
  blReference: string,
) {
  const [row] = await db
    .select({ id: dossiers.id })
    .from(dossiers)
    .where(
      and(
        eq(dossiers.organizationId, ctx.organizationId),
        eq(dossiers.blReference, blReference),
      ),
    )
    .limit(1);
  return row ?? null;
}

export async function listDeclarations(
  db: DbLike,
  ctx: ModuleContext,
  filters: DeclarationListFilters = {},
  limit = 500,
): Promise<DeclarationListItem[]> {
  const conditions = [eq(declarations.organizationId, ctx.organizationId)];

  if (filters.customerId) {
    conditions.push(eq(dossiers.customerId, filters.customerId));
  }
  if (filters.zoneOrTerminal) {
    conditions.push(eq(declarations.zoneOrTerminal, filters.zoneOrTerminal));
  }
  if (filters.bonADelivrer !== undefined) {
    conditions.push(eq(declarations.bonADelivrer, filters.bonADelivrer));
  }
  if (filters.dateFrom) {
    conditions.push(gte(declarations.declarationDate, filters.dateFrom));
  }
  if (filters.dateTo) {
    conditions.push(lte(declarations.declarationDate, filters.dateTo));
  }
  if (filters.search) {
    const pattern = `%${filters.search}%`;
    conditions.push(
      or(
        ilike(declarations.declarationNumber, pattern),
        ilike(dossiers.blReference, pattern),
        ilike(dossiers.dossierNumber, pattern),
        ilike(customers.name, pattern),
        ilike(customers.slug, pattern),
      )!,
    );
  }

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
      dossierNumber: dossiers.dossierNumber,
      createdAt: declarations.createdAt,
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
    .where(and(...conditions))
    .orderBy(desc(declarations.updatedAt))
    .limit(limit);

  const containersById = await loadContainersByDeclarationIds(
    db,
    rows.map((r) => r.id),
  );

  return rows.map((r) => ({
    ...r,
    declarationDate: r.declarationDate ?? null,
    containers: containersById.get(r.id) ?? [],
  }));
}

export async function listDeclarationsForCustomer(
  db: DbLike,
  ctx: ModuleContext,
  customerId: string,
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
      dossierNumber: dossiers.dossierNumber,
      createdAt: declarations.createdAt,
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
    .where(
      and(
        eq(declarations.organizationId, ctx.organizationId),
        eq(dossiers.customerId, customerId),
      ),
    )
    .orderBy(desc(declarations.updatedAt))
    .limit(limit);

  const containersById = await loadContainersByDeclarationIds(
    db,
    rows.map((r) => r.id),
  );

  return rows.map((r) => ({
    ...r,
    declarationDate: r.declarationDate ?? null,
    containers: containersById.get(r.id) ?? [],
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

export type DeclarationEditLogEntry = {
  id: string;
  changes: Record<string, { from: string | null; to: string | null }>;
  changedBy: string | null;
  changedAt: Date;
};

export async function listDeclarationEditLog(
  db: DbLike,
  ctx: ModuleContext,
  declarationId: string,
): Promise<DeclarationEditLogEntry[]> {
  const rows = await db
    .select({
      id: declarationEditLog.id,
      changes: declarationEditLog.changes,
      changedBy: declarationEditLog.changedBy,
      changedAt: declarationEditLog.changedAt,
    })
    .from(declarationEditLog)
    .where(
      and(
        eq(declarationEditLog.declarationId, declarationId),
        eq(declarationEditLog.organizationId, ctx.organizationId),
      ),
    )
    .orderBy(desc(declarationEditLog.changedAt));

  return rows.map((row) => ({
    id: row.id,
    changes: row.changes as DeclarationEditLogEntry["changes"],
    changedBy: row.changedBy,
    changedAt: row.changedAt,
  }));
}

export async function createDeclaration(
  db: DbLike,
  ctx: ModuleContext,
  input: CreateDeclarationInput,
) {
  const bl = input.blReference.trim();
  await assertCustomerInOrg(db, ctx.organizationId, input.customerId);
  await assertAgencyInOrg(db, ctx.organizationId, input.payingAgencyId);

  const containers = (input.containers ?? [])
    .map((c) => c.trim())
    .filter(Boolean);
  const containerCount =
    input.containerCount != null ? input.containerCount : containers.length;

  try {
    return await db.transaction(async (tx) => {
      const existing = await findDossierByBl(tx, ctx, bl);
      if (existing) {
        throw new DuplicateBlError(bl);
      }

      const dossier = await createDossier(tx, ctx, {
        customerId: input.customerId,
        dossierType: input.dossierType,
        blReference: bl,
        title: input.title,
      });

      const declarationNumber = input.declarationNumber;

      const [existingNumber] = await tx
        .select({ id: declarations.id })
        .from(declarations)
        .where(
          and(
            eq(declarations.organizationId, ctx.organizationId),
            eq(declarations.declarationNumber, declarationNumber),
          ),
        )
        .limit(1);

      if (existingNumber) {
        throw new DuplicateDeclarationNumberError(declarationNumber);
      }

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
          blReference: bl,
          containerCount,
          containers,
        },
        actorId: ctx.userId,
      });

      return { declaration, dossier };
    });
  } catch (err) {
    if (err instanceof DuplicateBlError) throw err;
    if (err instanceof DuplicateDeclarationNumberError) throw err;
    if (isUniqueViolation(err)) {
      throw new DuplicateBlError(bl);
    }
    throw err;
  }
}

export async function updateDeclaration(
  db: DbLike,
  ctx: ModuleContext,
  declarationId: string,
  input: UpdateDeclarationInput,
) {
  return db.transaction(async (tx) => {
    // Lock & re-read inside transaction so BAD validation matches what we write.
    const [locked] = await tx
      .select()
      .from(declarations)
      .where(
        and(
          eq(declarations.id, declarationId),
          eq(declarations.organizationId, ctx.organizationId),
        ),
      )
      .for("update")
      .limit(1);

    if (!locked) return null;

    const lockedDossier = await getDossierById(tx, ctx, locked.dossierId);
    if (!lockedDossier) return null;

    const existingContainers = await loadContainers(tx, declarationId);

    // Derive next values respecting "undefined = no change", "null = clear".
    const nextZone =
      input.zoneOrTerminal !== undefined
        ? (input.zoneOrTerminal?.trim() || null)
        : locked.zoneOrTerminal;
    const nextDate =
      input.declarationDate !== undefined
        ? input.declarationDate || null
        : locked.declarationDate;
    const nextBl =
      input.blReference !== undefined
        ? (input.blReference?.trim() || null)
        : lockedDossier.blReference;
    const nextContainers =
      input.containers !== undefined
        ? input.containers.map((c) => c.trim()).filter(Boolean)
        : existingContainers;
    // If containers change but count not provided, derive from list.
    const nextContainerCount =
      input.containerCount !== undefined && input.containerCount !== null
        ? input.containerCount
        : input.containers !== undefined
          ? nextContainers.length
          : locked.containerCount;
    const nextClientAmount =
      input.clientAmountPaid !== undefined
        ? input.clientAmountPaid
        : locked.clientAmountPaid;
    const nextGainde =
      input.gaindeDutyAmount !== undefined
        ? input.gaindeDutyAmount
        : locked.gaindeDutyAmount;
    const nextCostPrice =
      input.costPrice !== undefined ? input.costPrice : locked.costPrice;
    const nextAgencyId =
      input.payingAgencyId !== undefined
        ? input.payingAgencyId
        : locked.payingAgencyId;
    const nextCustomsRef =
      input.customsReference !== undefined
        ? input.customsReference
        : locked.customsReference;
    const nextBureau =
      input.bureau !== undefined ? input.bureau : locked.bureau;
    const nextBad =
      input.bonADelivrer !== undefined
        ? input.bonADelivrer
        : locked.bonADelivrer;

    await assertAgencyInOrg(tx, ctx.organizationId, nextAgencyId);

    if (nextBad) {
      const missing = getBonADelivrerMissingFields({
        zoneOrTerminal: nextZone,
        declarationDate: nextDate,
        blReference: nextBl,
        containerCount: nextContainerCount,
        containers: nextContainers,
        clientAmountPaid: nextClientAmount,
        gaindeDutyAmount: nextGainde,
        costPrice: nextCostPrice,
      });
      if (missing.length > 0) {
        throw new BonADelivrerIncompleteError(missing);
      }
    }

    // BL uniqueness inside the transaction (only if changing).
    if (
      input.blReference !== undefined &&
      nextBl &&
      nextBl !== lockedDossier.blReference
    ) {
      const [conflict] = await tx
        .select({ id: dossiers.id })
        .from(dossiers)
        .where(
          and(
            eq(dossiers.organizationId, ctx.organizationId),
            eq(dossiers.blReference, nextBl),
          ),
        )
        .limit(1);
      if (conflict && conflict.id !== lockedDossier.id) {
        throw new DuplicateBlError(nextBl);
      }
    }

    if (input.blReference !== undefined) {
      await updateDossierBlReference(tx, ctx, lockedDossier.id, nextBl);
    }

    const [updated] = await tx
      .update(declarations)
      .set({
        zoneOrTerminal: nextZone,
        declarationDate: nextDate,
        containerCount: nextContainerCount,
        clientAmountPaid: nextClientAmount,
        gaindeDutyAmount: nextGainde,
        costPrice: nextCostPrice,
        payingAgencyId: nextAgencyId,
        customsReference: nextCustomsRef,
        bureau: nextBureau,
        bonADelivrer: nextBad,
        bonADelivrerAt: nextBad
          ? locked.bonADelivrer
            ? locked.bonADelivrerAt
            : new Date()
          : null,
        version: locked.version + 1,
      })
      .where(eq(declarations.id, declarationId))
      .returning();

    if (input.containers !== undefined) {
      await syncContainers(tx, ctx, declarationId, nextContainers);
    }

    const beforeSnapshot: Record<string, unknown> = {
      zone_or_terminal: locked.zoneOrTerminal,
      declaration_date: locked.declarationDate,
      container_count: locked.containerCount,
      containers: existingContainers,
      client_amount_paid: locked.clientAmountPaid,
      gainde_duty_amount: locked.gaindeDutyAmount,
      cost_price: locked.costPrice,
      paying_agency_id: locked.payingAgencyId,
      bl_reference: lockedDossier.blReference,
      customs_reference: locked.customsReference,
      bureau: locked.bureau,
      bon_a_delivrer: locked.bonADelivrer,
    };

    const afterSnapshot: Record<string, unknown> = {
      zone_or_terminal: updated.zoneOrTerminal,
      declaration_date: updated.declarationDate,
      container_count: updated.containerCount,
      containers: nextContainers,
      client_amount_paid: updated.clientAmountPaid,
      gainde_duty_amount: updated.gaindeDutyAmount,
      cost_price: updated.costPrice,
      paying_agency_id: updated.payingAgencyId,
      bl_reference: nextBl,
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

export class DeclarationHasLedgerEntriesError extends Error {
  constructor() {
    super(
      "Cette déclaration ne peut pas être supprimée car elle a des écritures comptables associées.",
    );
    this.name = "DeclarationHasLedgerEntriesError";
  }
}

export async function deleteDeclaration(
  db: DbLike,
  ctx: ModuleContext,
  declarationId: string,
) {
  const [existing] = await db
    .select({
      id: declarations.id,
      declarationNumber: declarations.declarationNumber,
      customerId: dossiers.customerId,
    })
    .from(declarations)
    .innerJoin(dossiers, eq(declarations.dossierId, dossiers.id))
    .where(
      and(
        eq(declarations.id, declarationId),
        eq(declarations.organizationId, ctx.organizationId),
      ),
    )
    .limit(1);

  if (!existing) return null;

  const [{ n }] = await db
    .select({ n: count() })
    .from(ledgerEntries)
    .where(
      and(
        eq(ledgerEntries.organizationId, ctx.organizationId),
        eq(ledgerEntries.declarationId, declarationId),
      ),
    );

  if (n > 0) {
    throw new DeclarationHasLedgerEntriesError();
  }

  await db
    .delete(declarations)
    .where(
      and(
        eq(declarations.id, declarationId),
        eq(declarations.organizationId, ctx.organizationId),
      ),
    );

  await appendActivity(db, {
    organizationId: ctx.organizationId,
    entityType: "declaration",
    entityId: declarationId,
    action: "declaration.deleted",
    payload: { declarationNumber: existing.declarationNumber },
    actorId: ctx.userId,
  });

  return existing;
}
