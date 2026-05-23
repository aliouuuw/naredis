import { pgEnum } from "drizzle-orm/pg-core";

export const memberRoleEnum = pgEnum("member_role", [
  "owner",
  "admin",
  "operator",
  "accountant",
]);

export type MemberRole = (typeof memberRoleEnum.enumValues)[number];

export const customerAccountStatusEnum = pgEnum("customer_account_status", [
  "a_jour",
  "pas_a_jour",
]);

export type CustomerAccountStatus =
  (typeof customerAccountStatusEnum.enumValues)[number];

export const balanceSideEnum = pgEnum("balance_side", ["debit", "credit"]);

export type BalanceSide = (typeof balanceSideEnum.enumValues)[number];

export const dossierTypeEnum = pgEnum("dossier_type", [
  "import",
  "export",
  "transit",
]);

export const caseStatusEnum = pgEnum("case_status", [
  "open",
  "on_hold",
  "closed",
]);

export const declarationKindEnum = pgEnum("declaration_kind", [
  "initial",
  "rectification",
  "complement",
]);

export const declarationStatusEnum = pgEnum("declaration_status", [
  "draft",
  "documents_pending",
  "submitted",
  "under_review",
  "cleared",
  "delivered",
  "invoiced",
  "closed",
]);

/** Client account transaction types (Notion Transactions). No `report` — computed at day open. */
export const ledgerEntryTypeEnum = pgEnum("ledger_entry_type", [
  "versement",
  "charge",
  "opening_balance",
  "reversal",
]);

export const ledgerCategoryEnum = pgEnum("ledger_category", [
  "honoraires",
  "debours",
  "other",
]);

export const documentTypeEnum = pgEnum("document_type", [
  "bill_of_lading",
  "commercial_invoice",
  "packing_list",
  "customs_declaration",
  "customs_receipt",
  "delivery_order",
  "agency_invoice",
  "other",
]);

export const documentSourceEnum = pgEnum("document_source", [
  "client",
  "agent",
  "customs",
]);

export const documentStatusEnum = pgEnum("document_status", [
  "pending",
  "active",
  "archived",
]);

export const activityEntityTypeEnum = pgEnum("activity_entity_type", [
  "dossier",
  "declaration",
  "customer",
  "ledger_entry",
]);
