import { integer, pgTable, primaryKey, uuid } from "drizzle-orm/pg-core";
import { organizations } from "./organizations";

/**
 * Per-org, per-year sequences so display numbers reset on January 1
 * in agency local time (e.g. `D-2027-0001`).
 */
export const dossierSequences = pgTable(
  "dossier_sequences",
  {
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    year: integer("year").notNull(),
    lastValue: integer("last_value").notNull().default(0),
  },
  (table) => [
    primaryKey({ columns: [table.organizationId, table.year] }),
  ],
);

export const declarationSequences = pgTable(
  "declaration_sequences",
  {
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    year: integer("year").notNull(),
    lastValue: integer("last_value").notNull().default(0),
  },
  (table) => [
    primaryKey({ columns: [table.organizationId, table.year] }),
  ],
);
