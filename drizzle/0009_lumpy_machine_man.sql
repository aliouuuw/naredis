CREATE TABLE "gainde_card_loads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"paying_agency_id" uuid NOT NULL,
	"amount" bigint NOT NULL,
	"effective_date" date NOT NULL,
	"label" text,
	"notes" text,
	"created_by_user_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "gainde_card_loads" ADD CONSTRAINT "gainde_card_loads_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gainde_card_loads" ADD CONSTRAINT "gainde_card_loads_paying_agency_id_organization_agencies_id_fk" FOREIGN KEY ("paying_agency_id") REFERENCES "public"."organization_agencies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gainde_card_loads" ADD CONSTRAINT "gainde_card_loads_created_by_user_id_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "gainde_card_loads_org_agency_date_idx" ON "gainde_card_loads" USING btree ("organization_id","paying_agency_id","effective_date");--> statement-breakpoint
CREATE INDEX "gainde_card_loads_org_idx" ON "gainde_card_loads" USING btree ("organization_id");