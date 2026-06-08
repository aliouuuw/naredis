import {
  bigint,
  date,
  index,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { user } from "./auth";
import { organizationAgencies } from "./agencies";
import { organizations } from "./organizations";

/** Règlement de carte (crédit) sur une carte GAINDE (maison-mère). */
export const gaindeCardLoads = pgTable(
  "gainde_card_loads",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    payingAgencyId: uuid("paying_agency_id")
      .notNull()
      .references(() => organizationAgencies.id, { onDelete: "cascade" }),
    amount: bigint("amount", { mode: "bigint" }).notNull(),
    effectiveDate: date("effective_date").notNull(),
    label: text("label"),
    notes: text("notes"),
    createdByUserId: text("created_by_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("gainde_card_loads_org_agency_date_idx").on(
      table.organizationId,
      table.payingAgencyId,
      table.effectiveDate,
    ),
    index("gainde_card_loads_org_idx").on(table.organizationId),
  ],
);
