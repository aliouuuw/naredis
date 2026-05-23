CREATE TYPE "public"."balance_side" AS ENUM('debit', 'credit');--> statement-breakpoint
CREATE TYPE "public"."customer_account_status" AS ENUM('a_jour', 'pas_a_jour');--> statement-breakpoint
CREATE TABLE "organization_agencies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "declaration_containers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"declaration_id" uuid NOT NULL,
	"container_number" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "declaration_edit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"declaration_id" uuid NOT NULL,
	"changes" jsonb NOT NULL,
	"changed_by" text,
	"changed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "slug" text;--> statement-breakpoint
UPDATE "customers" SET "slug" = lower(regexp_replace(trim("name"), '[^a-zA-Z0-9]+', '-', 'g')) WHERE "slug" IS NULL;--> statement-breakpoint
UPDATE "customers" SET "slug" = left("id"::text, 8) WHERE "slug" IS NULL OR "slug" = '';--> statement-breakpoint
ALTER TABLE "customers" ALTER COLUMN "slug" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "account_status" "customer_account_status" DEFAULT 'pas_a_jour' NOT NULL;--> statement-breakpoint
ALTER TABLE "declarations" ADD COLUMN "zone_or_terminal" text;--> statement-breakpoint
ALTER TABLE "declarations" ADD COLUMN "declaration_date" date;--> statement-breakpoint
ALTER TABLE "declarations" ADD COLUMN "container_count" integer;--> statement-breakpoint
ALTER TABLE "declarations" ADD COLUMN "client_amount_paid" bigint;--> statement-breakpoint
ALTER TABLE "declarations" ADD COLUMN "gainde_duty_amount" bigint;--> statement-breakpoint
ALTER TABLE "declarations" ADD COLUMN "cost_price" bigint;--> statement-breakpoint
ALTER TABLE "declarations" ADD COLUMN "paying_agency_id" uuid;--> statement-breakpoint
ALTER TABLE "declarations" ADD COLUMN "bon_a_delivrer" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "declarations" ADD COLUMN "bon_a_delivrer_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "ledger_entries" ADD COLUMN "balance_side" "balance_side";--> statement-breakpoint
UPDATE "ledger_entries" SET "balance_side" = CASE
  WHEN "entry_type"::text IN ('payment', 'versement') THEN 'credit'::"balance_side"
  WHEN "entry_type"::text = 'reversal' THEN 'debit'::"balance_side"
  ELSE 'debit'::"balance_side"
END WHERE "balance_side" IS NULL;--> statement-breakpoint
ALTER TABLE "ledger_entries" ALTER COLUMN "balance_side" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "ledger_entries" ADD COLUMN "notes" text;--> statement-breakpoint
ALTER TABLE "ledger_entries" ALTER COLUMN "entry_type" SET DATA TYPE text;--> statement-breakpoint
UPDATE "ledger_entries" SET "entry_type" = 'versement' WHERE "entry_type" = 'payment';--> statement-breakpoint
DROP TYPE "public"."ledger_entry_type";--> statement-breakpoint
CREATE TYPE "public"."ledger_entry_type" AS ENUM('versement', 'charge', 'opening_balance', 'reversal');--> statement-breakpoint
ALTER TABLE "ledger_entries" ALTER COLUMN "entry_type" SET DATA TYPE "public"."ledger_entry_type" USING "entry_type"::"public"."ledger_entry_type";--> statement-breakpoint
ALTER TABLE "organization_agencies" ADD CONSTRAINT "organization_agencies_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "declaration_containers" ADD CONSTRAINT "declaration_containers_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "declaration_containers" ADD CONSTRAINT "declaration_containers_declaration_id_declarations_id_fk" FOREIGN KEY ("declaration_id") REFERENCES "public"."declarations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "declaration_edit_log" ADD CONSTRAINT "declaration_edit_log_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "declaration_edit_log" ADD CONSTRAINT "declaration_edit_log_declaration_id_declarations_id_fk" FOREIGN KEY ("declaration_id") REFERENCES "public"."declarations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "organization_agencies_organization_id_name_idx" ON "organization_agencies" USING btree ("organization_id","name");--> statement-breakpoint
CREATE INDEX "organization_agencies_organization_id_idx" ON "organization_agencies" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "declaration_containers_declaration_id_idx" ON "declaration_containers" USING btree ("declaration_id");--> statement-breakpoint
CREATE INDEX "declaration_containers_organization_id_idx" ON "declaration_containers" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "declaration_edit_log_declaration_id_idx" ON "declaration_edit_log" USING btree ("declaration_id");--> statement-breakpoint
CREATE INDEX "declaration_edit_log_organization_id_idx" ON "declaration_edit_log" USING btree ("organization_id");--> statement-breakpoint
ALTER TABLE "declarations" ADD CONSTRAINT "declarations_paying_agency_id_organization_agencies_id_fk" FOREIGN KEY ("paying_agency_id") REFERENCES "public"."organization_agencies"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "customers_organization_id_slug_idx" ON "customers" USING btree ("organization_id","slug");--> statement-breakpoint
CREATE INDEX "declarations_paying_agency_id_idx" ON "declarations" USING btree ("paying_agency_id");
