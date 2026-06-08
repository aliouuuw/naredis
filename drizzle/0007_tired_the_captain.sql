CREATE TABLE "organization_list_views" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"page_key" text NOT NULL,
	"name" text NOT NULL,
	"query" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_by_user_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "organization_list_views" ADD CONSTRAINT "organization_list_views_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_list_views" ADD CONSTRAINT "organization_list_views_created_by_user_id_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "organization_list_views_org_page_name_idx" ON "organization_list_views" USING btree ("organization_id","page_key","name");--> statement-breakpoint
CREATE INDEX "organization_list_views_org_page_idx" ON "organization_list_views" USING btree ("organization_id","page_key");