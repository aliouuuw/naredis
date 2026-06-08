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
import { organizationAgencies } from "./agencies";
import { organizations } from "./organizations";

/** Configurable zone / terminal codes for declaration numbers (per org). */
export const organizationZones = pgTable(
  "organization_zones",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    label: text("label").notNull(),
    isActive: boolean("is_active").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    /** Default GAINDE card (maison-mère) when declaring in this zone. */
    defaultPayingAgencyId: uuid("default_paying_agency_id").references(
      () => organizationAgencies.id,
      { onDelete: "set null" },
    ),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("organization_zones_organization_id_slug_idx").on(
      table.organizationId,
      table.slug,
    ),
    index("organization_zones_organization_id_idx").on(table.organizationId),
  ],
);
