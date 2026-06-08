import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { organizations } from "./organizations";

/** Org-configurable debit categories on a GAINDE card (taxe intérieur, …). */
export const gaindeCardDebitTypes = pgTable(
  "gainde_card_debit_types",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    code: text("code").notNull(),
    active: boolean("active").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("gainde_card_debit_types_organization_id_code_idx").on(
      table.organizationId,
      table.code,
    ),
    index("gainde_card_debit_types_organization_id_idx").on(
      table.organizationId,
    ),
  ],
);
