import {
  bigint,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import {
  documentSourceEnum,
  documentStatusEnum,
  documentTypeEnum,
} from "../enums";
import { declarations } from "./declarations";
import { dossiers } from "./dossiers";
import { organizations } from "./organizations";

export const documents = pgTable(
  "documents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    dossierId: uuid("dossier_id")
      .notNull()
      .references(() => dossiers.id, { onDelete: "cascade" }),
    declarationId: uuid("declaration_id").references(() => declarations.id, {
      onDelete: "set null",
    }),
    documentType: documentTypeEnum("document_type").notNull(),
    storageKey: text("storage_key").notNull(),
    fileName: text("file_name").notNull(),
    mimeType: text("mime_type"),
    sizeBytes: bigint("size_bytes", { mode: "bigint" }),
    version: integer("version").notNull().default(1),
    source: documentSourceEnum("source").notNull().default("client"),
    status: documentStatusEnum("status").notNull().default("active"),
    uploadedBy: text("uploaded_by"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("documents_organization_id_idx").on(table.organizationId),
    index("documents_dossier_id_idx").on(table.dossierId),
    index("documents_declaration_id_idx").on(table.declarationId),
  ],
);
