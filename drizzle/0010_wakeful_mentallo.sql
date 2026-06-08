CREATE TABLE "gainde_card_debit_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gainde_card_debits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"paying_agency_id" uuid NOT NULL,
	"debit_type_id" uuid NOT NULL,
	"amount" bigint NOT NULL,
	"effective_date" date NOT NULL,
	"label" text,
	"notes" text,
	"created_by_user_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "gainde_card_debit_types" ADD CONSTRAINT "gainde_card_debit_types_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gainde_card_debits" ADD CONSTRAINT "gainde_card_debits_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gainde_card_debits" ADD CONSTRAINT "gainde_card_debits_paying_agency_id_organization_agencies_id_fk" FOREIGN KEY ("paying_agency_id") REFERENCES "public"."organization_agencies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gainde_card_debits" ADD CONSTRAINT "gainde_card_debits_debit_type_id_gainde_card_debit_types_id_fk" FOREIGN KEY ("debit_type_id") REFERENCES "public"."gainde_card_debit_types"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gainde_card_debits" ADD CONSTRAINT "gainde_card_debits_created_by_user_id_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "gainde_card_debit_types_organization_id_code_idx" ON "gainde_card_debit_types" USING btree ("organization_id","code");--> statement-breakpoint
CREATE INDEX "gainde_card_debit_types_organization_id_idx" ON "gainde_card_debit_types" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "gainde_card_debits_org_agency_date_idx" ON "gainde_card_debits" USING btree ("organization_id","paying_agency_id","effective_date");--> statement-breakpoint
CREATE INDEX "gainde_card_debits_org_idx" ON "gainde_card_debits" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "gainde_card_debits_debit_type_idx" ON "gainde_card_debits" USING btree ("debit_type_id");