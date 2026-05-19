import {
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { declarationKindEnum, declarationStatusEnum } from "../enums";
import { dossiers } from "./dossiers";
import { organizations } from "./organizations";

export const declarations = pgTable(
  "declarations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    dossierId: uuid("dossier_id")
      .notNull()
      .references(() => dossiers.id, { onDelete: "cascade" }),
    declarationNumber: text("declaration_number").notNull(),
    kind: declarationKindEnum("kind").notNull().default("initial"),
    status: declarationStatusEnum("status").notNull().default("draft"),
    title: text("title"),
    customsReference: text("customs_reference"),
    regime: text("regime"),
    bureau: text("bureau"),
    openedAt: timestamp("opened_at", { withTimezone: true }),
    closedAt: timestamp("closed_at", { withTimezone: true }),
    version: integer("version").notNull().default(1),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("declarations_organization_id_declaration_number_idx").on(
      table.organizationId,
      table.declarationNumber,
    ),
    index("declarations_organization_id_status_idx").on(
      table.organizationId,
      table.status,
    ),
    index("declarations_organization_id_dossier_id_idx").on(
      table.organizationId,
      table.dossierId,
    ),
    index("declarations_organization_id_customs_reference_idx").on(
      table.organizationId,
      table.customsReference,
    ),
  ],
);

export const declarationStatusHistory = pgTable(
  "declaration_status_history",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    declarationId: uuid("declaration_id")
      .notNull()
      .references(() => declarations.id, { onDelete: "cascade" }),
    fromStatus: declarationStatusEnum("from_status"),
    toStatus: declarationStatusEnum("to_status").notNull(),
    changedBy: text("changed_by"),
    changedAt: timestamp("changed_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    note: text("note"),
  },
  (table) => [
    index("declaration_status_history_declaration_id_idx").on(
      table.declarationId,
    ),
  ],
);
