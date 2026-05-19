import { integer, pgTable, uuid } from "drizzle-orm/pg-core";
import { organizations } from "./organizations";

export const dossierSequences = pgTable("dossier_sequences", {
  organizationId: uuid("organization_id")
    .primaryKey()
    .references(() => organizations.id, { onDelete: "cascade" }),
  lastValue: integer("last_value").notNull().default(0),
});

export const declarationSequences = pgTable("declaration_sequences", {
  organizationId: uuid("organization_id")
    .primaryKey()
    .references(() => organizations.id, { onDelete: "cascade" }),
  lastValue: integer("last_value").notNull().default(0),
});
