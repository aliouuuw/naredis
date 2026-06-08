import {
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { user } from "./auth";
import { organizations } from "./organizations";

/** Shared saved table views (filters / sort / grouping) per ops page. */
export const organizationListViews = pgTable(
  "organization_list_views",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    /** e.g. declarations, clients, transactions */
    pageKey: text("page_key").notNull(),
    name: text("name").notNull(),
    /** Serialized query string (no leading ?), excludes page/open. */
    query: text("query").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    createdByUserId: text("created_by_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("organization_list_views_org_page_name_idx").on(
      table.organizationId,
      table.pageKey,
      table.name,
    ),
    index("organization_list_views_org_page_idx").on(
      table.organizationId,
      table.pageKey,
    ),
  ],
);
