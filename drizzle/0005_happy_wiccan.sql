CREATE TABLE "ledger_transaction_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"balance_side" "balance_side" NOT NULL,
	"system_key" "ledger_entry_type",
	"is_system" boolean DEFAULT false NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ledger_entries" ADD COLUMN "transaction_type_id" uuid;--> statement-breakpoint
ALTER TABLE "ledger_transaction_types" ADD CONSTRAINT "ledger_transaction_types_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "ledger_transaction_types_organization_id_code_idx" ON "ledger_transaction_types" USING btree ("organization_id","code");--> statement-breakpoint
CREATE INDEX "ledger_transaction_types_organization_id_idx" ON "ledger_transaction_types" USING btree ("organization_id");--> statement-breakpoint
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_transaction_type_id_ledger_transaction_types_id_fk" FOREIGN KEY ("transaction_type_id") REFERENCES "public"."ledger_transaction_types"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ledger_entries_transaction_type_id_idx" ON "ledger_entries" USING btree ("transaction_type_id");--> statement-breakpoint
CREATE INDEX "ledger_entries_organization_id_effective_date_idx" ON "ledger_entries" USING btree ("organization_id","effective_date");