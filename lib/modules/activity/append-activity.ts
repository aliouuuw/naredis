import type { DbLike } from "@/lib/db";
import { activityLog } from "@/lib/db/schema";
import type { activityEntityTypeEnum } from "@/lib/db/enums";

type EntityType = (typeof activityEntityTypeEnum.enumValues)[number];

export async function appendActivity(
  db: DbLike,
  params: {
    organizationId: string;
    entityType: EntityType;
    entityId: string;
    action: string;
    payload?: Record<string, unknown>;
    actorId?: string;
  },
) {
  await db.insert(activityLog).values({
    organizationId: params.organizationId,
    entityType: params.entityType,
    entityId: params.entityId,
    action: params.action,
    payload: params.payload,
    actorId: params.actorId,
  });
}
