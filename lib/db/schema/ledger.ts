import {
  bigint,
  char,
  date,
  foreignKey,
  index,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import {
  balanceSideEnum,
  ledgerCategoryEnum,
  ledgerEntryTypeEnum,
} from "../enums";
import { customers } from "./customers";
import { declarations } from "./declarations";
import { dossiers } from "./dossiers";
import { organizations } from "./organizations";
import { ledgerTransactionTypes } from "./ledger-transaction-types";

export const ledgerEntries = pgTable(
  "ledger_entries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "restrict" }),
    dossierId: uuid("dossier_id").references(() => dossiers.id, {
      onDelete: "restrict",
    }),
    declarationId: uuid("declaration_id").references(() => declarations.id, {
      onDelete: "restrict",
    }),
    transactionTypeId: uuid("transaction_type_id").references(
      () => ledgerTransactionTypes.id,
      { onDelete: "restrict" },
    ),
    entryType: ledgerEntryTypeEnum("entry_type").notNull(),
    balanceSide: balanceSideEnum("balance_side").notNull(),
    category: ledgerCategoryEnum("category"),
    amount: bigint("amount", { mode: "bigint" }).notNull(),
    currency: char("currency", { length: 3 }).notNull().default("XOF"),
    label: text("label").notNull(),
    notes: text("notes"),
    effectiveDate: date("effective_date").notNull(),
    reversesEntryId: uuid("reverses_entry_id"),
    createdBy: text("created_by"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    foreignKey({
      columns: [table.reversesEntryId],
      foreignColumns: [table.id],
      name: "ledger_entries_reverses_entry_id_fkey",
    }),
    index("ledger_entries_organization_id_customer_id_effective_date_idx").on(
      table.organizationId,
      table.customerId,
      table.effectiveDate,
    ),
    index("ledger_entries_dossier_id_idx").on(table.dossierId),
    index("ledger_entries_declaration_id_idx").on(table.declarationId),
    index("ledger_entries_transaction_type_id_idx").on(table.transactionTypeId),
    index("ledger_entries_organization_id_effective_date_idx").on(
      table.organizationId,
      table.effectiveDate,
    ),
  ],
);

export const paymentAllocations = pgTable(
  "payment_allocations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    ledgerEntryId: uuid("ledger_entry_id")
      .notNull()
      .references(() => ledgerEntries.id, { onDelete: "cascade" }),
    dossierId: uuid("dossier_id")
      .notNull()
      .references(() => dossiers.id, { onDelete: "restrict" }),
    amount: bigint("amount", { mode: "bigint" }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("payment_allocations_ledger_entry_id_idx").on(table.ledgerEntryId),
    index("payment_allocations_dossier_id_idx").on(table.dossierId),
    index("payment_allocations_organization_id_idx").on(table.organizationId),
  ],
);
