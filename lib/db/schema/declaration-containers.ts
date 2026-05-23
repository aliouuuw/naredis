import { index, integer, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { declarations } from "./declarations";
import { organizations } from "./organizations";

export const declarationContainers = pgTable(
  "declaration_containers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    declarationId: uuid("declaration_id")
      .notNull()
      .references(() => declarations.id, { onDelete: "cascade" }),
    containerNumber: text("container_number").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (table) => [
    index("declaration_containers_declaration_id_idx").on(table.declarationId),
    index("declaration_containers_organization_id_idx").on(
      table.organizationId,
    ),
  ],
);
