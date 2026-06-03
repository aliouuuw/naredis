import { and, desc, eq, inArray, or } from "drizzle-orm";
import type { DbLike } from "@/lib/db";
import type { activityEntityTypeEnum } from "@/lib/db/enums";
import {
  activityLog,
  declarations,
  dossiers,
  ledgerEntries,
} from "@/lib/db/schema";
import type { ModuleContext } from "@/lib/modules/shared/types";

type EntityType = (typeof activityEntityTypeEnum.enumValues)[number];

export type ActivityLogItem = {
  id: string;
  entityType: EntityType;
  entityId: string;
  action: string;
  payload: Record<string, unknown> | null;
  actorId: string | null;
  createdAt: Date;
};

export async function listActivityForDeclaration(
  db: DbLike,
  ctx: ModuleContext,
  declarationId: string,
  limit = 80,
): Promise<ActivityLogItem[]> {
  const [decl] = await db
    .select({
      id: declarations.id,
      dossierId: declarations.dossierId,
    })
    .from(declarations)
    .where(
      and(
        eq(declarations.id, declarationId),
        eq(declarations.organizationId, ctx.organizationId),
      ),
    )
    .limit(1);

  if (!decl) return [];

  const linkedLedger = await db
    .select({ id: ledgerEntries.id })
    .from(ledgerEntries)
    .where(
      and(
        eq(ledgerEntries.organizationId, ctx.organizationId),
        eq(ledgerEntries.declarationId, declarationId),
      ),
    );

  const ledgerIds = linkedLedger.map((r) => r.id);

  const entityConditions = [
    and(
      eq(activityLog.entityType, "declaration"),
      eq(activityLog.entityId, declarationId),
    ),
    and(
      eq(activityLog.entityType, "dossier"),
      eq(activityLog.entityId, decl.dossierId),
    ),
  ];

  if (ledgerIds.length > 0) {
    entityConditions.push(
      and(
        eq(activityLog.entityType, "ledger_entry"),
        inArray(activityLog.entityId, ledgerIds),
      ),
    );
  }

  const rows = await db
    .select()
    .from(activityLog)
    .where(
      and(
        eq(activityLog.organizationId, ctx.organizationId),
        or(...entityConditions),
      ),
    )
    .orderBy(desc(activityLog.createdAt))
    .limit(limit);

  return rows.map((row) => ({
    id: row.id,
    entityType: row.entityType,
    entityId: row.entityId,
    action: row.action,
    payload: row.payload ?? null,
    actorId: row.actorId,
    createdAt: row.createdAt,
  }));
}

export async function listActivityForDossier(
  db: DbLike,
  ctx: ModuleContext,
  dossierId: string,
  limit = 80,
): Promise<ActivityLogItem[]> {
  const declRows = await db
    .select({ id: declarations.id })
    .from(declarations)
    .where(
      and(
        eq(declarations.dossierId, dossierId),
        eq(declarations.organizationId, ctx.organizationId),
      ),
    );

  const declIds = declRows.map((r) => r.id);

  const ledgerOnDossier = await db
    .select({ id: ledgerEntries.id })
    .from(ledgerEntries)
    .where(
      and(
        eq(ledgerEntries.organizationId, ctx.organizationId),
        eq(ledgerEntries.dossierId, dossierId),
      ),
    );

  const ledgerIds = new Set(ledgerOnDossier.map((r) => r.id));

  const entityConditions = [
    and(
      eq(activityLog.entityType, "dossier"),
      eq(activityLog.entityId, dossierId),
    ),
  ];

  if (declIds.length > 0) {
    entityConditions.push(
      and(
        eq(activityLog.entityType, "declaration"),
        inArray(activityLog.entityId, declIds),
      ),
    );
  }

  if (ledgerIds.size > 0) {
    entityConditions.push(
      and(
        eq(activityLog.entityType, "ledger_entry"),
        inArray(activityLog.entityId, [...ledgerIds]),
      ),
    );
  }

  if (entityConditions.length === 0) return [];

  const rows = await db
    .select()
    .from(activityLog)
    .where(
      and(
        eq(activityLog.organizationId, ctx.organizationId),
        or(...entityConditions),
      ),
    )
    .orderBy(desc(activityLog.createdAt))
    .limit(limit);

  return rows.map((row) => ({
    id: row.id,
    entityType: row.entityType,
    entityId: row.entityId,
    action: row.action,
    payload: row.payload ?? null,
    actorId: row.actorId,
    createdAt: row.createdAt,
  }));
}

export async function listActivityForCustomer(
  db: DbLike,
  ctx: ModuleContext,
  customerId: string,
  limit = 80,
): Promise<ActivityLogItem[]> {
  const [dossierRows, declRows, ledgerRows] = await Promise.all([
    db
      .select({ id: dossiers.id })
      .from(dossiers)
      .where(
        and(
          eq(dossiers.customerId, customerId),
          eq(dossiers.organizationId, ctx.organizationId),
        ),
      ),
    db
      .select({ id: declarations.id })
      .from(declarations)
      .innerJoin(dossiers, eq(declarations.dossierId, dossiers.id))
      .where(
        and(
          eq(dossiers.customerId, customerId),
          eq(declarations.organizationId, ctx.organizationId),
        ),
      ),
    db
      .select({ id: ledgerEntries.id })
      .from(ledgerEntries)
      .where(
        and(
          eq(ledgerEntries.customerId, customerId),
          eq(ledgerEntries.organizationId, ctx.organizationId),
        ),
      ),
  ]);

  const dossierIds = dossierRows.map((r) => r.id);
  const declIds = declRows.map((r) => r.id);
  const ledgerIds = ledgerRows.map((r) => r.id);

  const entityConditions = [
    and(
      eq(activityLog.entityType, "customer"),
      eq(activityLog.entityId, customerId),
    ),
  ];

  if (dossierIds.length > 0) {
    entityConditions.push(
      and(
        eq(activityLog.entityType, "dossier"),
        inArray(activityLog.entityId, dossierIds),
      ),
    );
  }

  if (declIds.length > 0) {
    entityConditions.push(
      and(
        eq(activityLog.entityType, "declaration"),
        inArray(activityLog.entityId, declIds),
      ),
    );
  }

  if (ledgerIds.length > 0) {
    entityConditions.push(
      and(
        eq(activityLog.entityType, "ledger_entry"),
        inArray(activityLog.entityId, ledgerIds),
      ),
    );
  }

  const rows = await db
    .select()
    .from(activityLog)
    .where(
      and(
        eq(activityLog.organizationId, ctx.organizationId),
        or(...entityConditions),
      ),
    )
    .orderBy(desc(activityLog.createdAt))
    .limit(limit);

  return rows.map((row) => ({
    id: row.id,
    entityType: row.entityType,
    entityId: row.entityId,
    action: row.action,
    payload: row.payload ?? null,
    actorId: row.actorId,
    createdAt: row.createdAt,
  }));
}

export async function listRecentOrganizationActivity(
  db: DbLike,
  ctx: ModuleContext,
  limit = 20,
): Promise<ActivityLogItem[]> {
  const rows = await db
    .select()
    .from(activityLog)
    .where(eq(activityLog.organizationId, ctx.organizationId))
    .orderBy(desc(activityLog.createdAt))
    .limit(limit);

  return rows.map((row) => ({
    id: row.id,
    entityType: row.entityType,
    entityId: row.entityId,
    action: row.action,
    payload: row.payload ?? null,
    actorId: row.actorId,
    createdAt: row.createdAt,
  }));
}
