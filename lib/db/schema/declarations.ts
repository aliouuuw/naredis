import {
  bigint,
  boolean,
  date,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { declarationKindEnum, declarationStatusEnum } from "../enums";
import { organizationAgencies } from "./agencies";
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
    zoneOrTerminal: text("zone_or_terminal"),
    declarationDate: date("declaration_date"),
    containerCount: integer("container_count"),
    /** Montant — total client paid agency for this BL */
    clientAmountPaid: bigint("client_amount_paid", { mode: "bigint" }),
    /** Droit de douane paid via GAINDE */
    gaindeDutyAmount: bigint("gainde_duty_amount", { mode: "bigint" }),
    /** Prix de revient — agency all-in cost; may diverge from GAINDE */
    costPrice: bigint("cost_price", { mode: "bigint" }),
    payingAgencyId: uuid("paying_agency_id").references(
      () => organizationAgencies.id,
      { onDelete: "set null" },
    ),
    bonADelivrer: boolean("bon_a_delivrer").notNull().default(false),
    bonADelivrerAt: timestamp("bon_a_delivrer_at", { withTimezone: true }),
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
    index("declarations_paying_agency_id_idx").on(table.payingAgencyId),
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
