CREATE TYPE "public"."activity_entity_type" AS ENUM('dossier', 'declaration', 'customer', 'ledger_entry');--> statement-breakpoint
CREATE TYPE "public"."case_status" AS ENUM('open', 'on_hold', 'closed');--> statement-breakpoint
CREATE TYPE "public"."declaration_kind" AS ENUM('initial', 'rectification', 'complement');--> statement-breakpoint
CREATE TYPE "public"."declaration_status" AS ENUM('draft', 'documents_pending', 'submitted', 'under_review', 'cleared', 'delivered', 'invoiced', 'closed');--> statement-breakpoint
CREATE TYPE "public"."document_source" AS ENUM('client', 'agent', 'customs');--> statement-breakpoint
CREATE TYPE "public"."document_status" AS ENUM('pending', 'active', 'archived');--> statement-breakpoint
CREATE TYPE "public"."document_type" AS ENUM('bill_of_lading', 'commercial_invoice', 'packing_list', 'customs_declaration', 'customs_receipt', 'delivery_order', 'agency_invoice', 'other');--> statement-breakpoint
CREATE TYPE "public"."dossier_type" AS ENUM('import', 'export', 'transit');--> statement-breakpoint
CREATE TYPE "public"."ledger_category" AS ENUM('honoraires', 'debours', 'other');--> statement-breakpoint
CREATE TYPE "public"."ledger_entry_type" AS ENUM('charge', 'payment', 'opening_balance', 'reversal');--> statement-breakpoint
CREATE TYPE "public"."member_role" AS ENUM('owner', 'admin', 'operator', 'accountant');--> statement-breakpoint
CREATE TABLE "activity_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"entity_type" "activity_entity_type" NOT NULL,
	"entity_id" uuid NOT NULL,
	"action" text NOT NULL,
	"payload" jsonb,
	"actor_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" text NOT NULL,
	"code" text,
	"email" text,
	"phone" text,
	"tax_id" text,
	"notes" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "declaration_status_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"declaration_id" uuid NOT NULL,
	"from_status" "declaration_status",
	"to_status" "declaration_status" NOT NULL,
	"changed_by" text,
	"changed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"note" text
);
--> statement-breakpoint
CREATE TABLE "declarations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"dossier_id" uuid NOT NULL,
	"declaration_number" text NOT NULL,
	"kind" "declaration_kind" DEFAULT 'initial' NOT NULL,
	"status" "declaration_status" DEFAULT 'draft' NOT NULL,
	"title" text,
	"customs_reference" text,
	"regime" text,
	"bureau" text,
	"opened_at" timestamp with time zone,
	"closed_at" timestamp with time zone,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"dossier_id" uuid NOT NULL,
	"declaration_id" uuid,
	"document_type" "document_type" NOT NULL,
	"storage_key" text NOT NULL,
	"file_name" text NOT NULL,
	"mime_type" text,
	"size_bytes" bigint,
	"version" integer DEFAULT 1 NOT NULL,
	"source" "document_source" DEFAULT 'client' NOT NULL,
	"status" "document_status" DEFAULT 'active' NOT NULL,
	"uploaded_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dossiers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"dossier_number" text NOT NULL,
	"dossier_type" "dossier_type" DEFAULT 'import' NOT NULL,
	"case_status" "case_status" DEFAULT 'open' NOT NULL,
	"title" text,
	"description" text,
	"bl_reference" text,
	"container_reference" text,
	"opened_at" timestamp with time zone DEFAULT now() NOT NULL,
	"closed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ledger_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"dossier_id" uuid,
	"declaration_id" uuid,
	"entry_type" "ledger_entry_type" NOT NULL,
	"category" "ledger_category",
	"amount" bigint NOT NULL,
	"currency" char(3) DEFAULT 'XOF' NOT NULL,
	"label" text NOT NULL,
	"effective_date" date NOT NULL,
	"reverses_entry_id" uuid,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_allocations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"ledger_entry_id" uuid NOT NULL,
	"dossier_id" uuid NOT NULL,
	"amount" bigint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organization_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"role" "member_role" DEFAULT 'operator' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "declaration_sequences" (
	"organization_id" uuid PRIMARY KEY NOT NULL,
	"last_value" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dossier_sequences" (
	"organization_id" uuid PRIMARY KEY NOT NULL,
	"last_value" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "activity_log" ADD CONSTRAINT "activity_log_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "declaration_status_history" ADD CONSTRAINT "declaration_status_history_declaration_id_declarations_id_fk" FOREIGN KEY ("declaration_id") REFERENCES "public"."declarations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "declarations" ADD CONSTRAINT "declarations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "declarations" ADD CONSTRAINT "declarations_dossier_id_dossiers_id_fk" FOREIGN KEY ("dossier_id") REFERENCES "public"."dossiers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_dossier_id_dossiers_id_fk" FOREIGN KEY ("dossier_id") REFERENCES "public"."dossiers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_declaration_id_declarations_id_fk" FOREIGN KEY ("declaration_id") REFERENCES "public"."declarations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dossiers" ADD CONSTRAINT "dossiers_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dossiers" ADD CONSTRAINT "dossiers_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_dossier_id_dossiers_id_fk" FOREIGN KEY ("dossier_id") REFERENCES "public"."dossiers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_declaration_id_declarations_id_fk" FOREIGN KEY ("declaration_id") REFERENCES "public"."declarations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_reverses_entry_id_fkey" FOREIGN KEY ("reverses_entry_id") REFERENCES "public"."ledger_entries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_allocations" ADD CONSTRAINT "payment_allocations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_allocations" ADD CONSTRAINT "payment_allocations_ledger_entry_id_ledger_entries_id_fk" FOREIGN KEY ("ledger_entry_id") REFERENCES "public"."ledger_entries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_allocations" ADD CONSTRAINT "payment_allocations_dossier_id_dossiers_id_fk" FOREIGN KEY ("dossier_id") REFERENCES "public"."dossiers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "declaration_sequences" ADD CONSTRAINT "declaration_sequences_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dossier_sequences" ADD CONSTRAINT "dossier_sequences_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "activity_log_organization_id_created_at_idx" ON "activity_log" USING btree ("organization_id","created_at");--> statement-breakpoint
CREATE INDEX "activity_log_entity_type_entity_id_idx" ON "activity_log" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "customers_organization_id_idx" ON "customers" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "customers_organization_id_name_idx" ON "customers" USING btree ("organization_id","name");--> statement-breakpoint
CREATE INDEX "declaration_status_history_declaration_id_idx" ON "declaration_status_history" USING btree ("declaration_id");--> statement-breakpoint
CREATE UNIQUE INDEX "declarations_organization_id_declaration_number_idx" ON "declarations" USING btree ("organization_id","declaration_number");--> statement-breakpoint
CREATE INDEX "declarations_organization_id_status_idx" ON "declarations" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "declarations_organization_id_dossier_id_idx" ON "declarations" USING btree ("organization_id","dossier_id");--> statement-breakpoint
CREATE INDEX "declarations_organization_id_customs_reference_idx" ON "declarations" USING btree ("organization_id","customs_reference");--> statement-breakpoint
CREATE INDEX "documents_organization_id_idx" ON "documents" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "documents_dossier_id_idx" ON "documents" USING btree ("dossier_id");--> statement-breakpoint
CREATE INDEX "documents_declaration_id_idx" ON "documents" USING btree ("declaration_id");--> statement-breakpoint
CREATE UNIQUE INDEX "dossiers_organization_id_dossier_number_idx" ON "dossiers" USING btree ("organization_id","dossier_number");--> statement-breakpoint
CREATE INDEX "dossiers_organization_id_case_status_idx" ON "dossiers" USING btree ("organization_id","case_status");--> statement-breakpoint
CREATE INDEX "dossiers_organization_id_customer_id_idx" ON "dossiers" USING btree ("organization_id","customer_id");--> statement-breakpoint
CREATE INDEX "dossiers_organization_id_bl_reference_idx" ON "dossiers" USING btree ("organization_id","bl_reference");--> statement-breakpoint
CREATE INDEX "ledger_entries_organization_id_customer_id_effective_date_idx" ON "ledger_entries" USING btree ("organization_id","customer_id","effective_date");--> statement-breakpoint
CREATE INDEX "ledger_entries_dossier_id_idx" ON "ledger_entries" USING btree ("dossier_id");--> statement-breakpoint
CREATE INDEX "ledger_entries_declaration_id_idx" ON "ledger_entries" USING btree ("declaration_id");--> statement-breakpoint
CREATE INDEX "payment_allocations_ledger_entry_id_idx" ON "payment_allocations" USING btree ("ledger_entry_id");--> statement-breakpoint
CREATE INDEX "payment_allocations_dossier_id_idx" ON "payment_allocations" USING btree ("dossier_id");--> statement-breakpoint
CREATE INDEX "payment_allocations_organization_id_idx" ON "payment_allocations" USING btree ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "organization_members_org_user_idx" ON "organization_members" USING btree ("organization_id","user_id");--> statement-breakpoint
CREATE INDEX "organization_members_organization_id_idx" ON "organization_members" USING btree ("organization_id");