import { and, desc, eq, inArray, or } from "drizzle-orm";
import type { DbLike } from "@/lib/db";
import type { activityEntityTypeEnum } from "@/lib/db/enums";
import { activityLog, declarations, ledgerEntries } from "@/lib/db/schema";
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
