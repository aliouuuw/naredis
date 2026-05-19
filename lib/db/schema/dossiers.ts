import {
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { caseStatusEnum, dossierTypeEnum } from "../enums";
import { customers } from "./customers";
import { organizations } from "./organizations";

export const dossiers = pgTable(
  "dossiers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "restrict" }),
    dossierNumber: text("dossier_number").notNull(),
    dossierType: dossierTypeEnum("dossier_type").notNull().default("import"),
    caseStatus: caseStatusEnum("case_status").notNull().default("open"),
    title: text("title"),
    description: text("description"),
    blReference: text("bl_reference"),
    containerReference: text("container_reference"),
    openedAt: timestamp("opened_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    closedAt: timestamp("closed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("dossiers_organization_id_dossier_number_idx").on(
      table.organizationId,
      table.dossierNumber,
    ),
    index("dossiers_organization_id_case_status_idx").on(
      table.organizationId,
      table.caseStatus,
    ),
    index("dossiers_organization_id_customer_id_idx").on(
      table.organizationId,
      table.customerId,
    ),
    index("dossiers_organization_id_bl_reference_idx").on(
      table.organizationId,
      table.blReference,
    ),
  ],
);
