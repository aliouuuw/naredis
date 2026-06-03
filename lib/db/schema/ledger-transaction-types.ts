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
import { balanceSideEnum, ledgerEntryTypeEnum } from "../enums";
import { organizations } from "./organizations";

/** Org-configurable transaction types (credit or debit). System rows map to `ledger_entry_type`. */
export const ledgerTransactionTypes = pgTable(
  "ledger_transaction_types",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    code: text("code").notNull(),
    balanceSide: balanceSideEnum("balance_side").notNull(),
    /** Set for built-in types (versement, charge, …); null for user-created types. */
    systemKey: ledgerEntryTypeEnum("system_key"),
    isSystem: boolean("is_system").notNull().default(false),
    active: boolean("active").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("ledger_transaction_types_organization_id_code_idx").on(
      table.organizationId,
      table.code,
    ),
    index("ledger_transaction_types_organization_id_idx").on(
      table.organizationId,
    ),
  ],
);
