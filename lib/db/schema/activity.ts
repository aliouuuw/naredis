import { index, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { activityEntityTypeEnum } from "../enums";
import { organizations } from "./organizations";

export const activityLog = pgTable(
  "activity_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    entityType: activityEntityTypeEnum("entity_type").notNull(),
    entityId: uuid("entity_id").notNull(),
    action: text("action").notNull(),
    payload: jsonb("payload").$type<Record<string, unknown>>(),
    actorId: text("actor_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("activity_log_organization_id_created_at_idx").on(
      table.organizationId,
      table.createdAt,
    ),
    index("activity_log_entity_type_entity_id_idx").on(
      table.entityType,
      table.entityId,
    ),
  ],
);
