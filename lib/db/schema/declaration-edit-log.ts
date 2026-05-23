import { index, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { declarations } from "./declarations";
import { organizations } from "./organizations";

export const declarationEditLog = pgTable(
  "declaration_edit_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    declarationId: uuid("declaration_id")
      .notNull()
      .references(() => declarations.id, { onDelete: "cascade" }),
    changes: jsonb("changes").notNull(),
    changedBy: text("changed_by"),
    changedAt: timestamp("changed_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("declaration_edit_log_declaration_id_idx").on(table.declarationId),
    index("declaration_edit_log_organization_id_idx").on(table.organizationId),
  ],
);
