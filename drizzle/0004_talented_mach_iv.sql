DROP INDEX "dossiers_organization_id_bl_reference_idx";--> statement-breakpoint
ALTER TABLE "declaration_sequences" DROP CONSTRAINT "declaration_sequences_pkey";--> statement-breakpoint
ALTER TABLE "dossier_sequences" DROP CONSTRAINT "dossier_sequences_pkey";--> statement-breakpoint
ALTER TABLE "declaration_sequences" ADD COLUMN "year" integer NOT NULL DEFAULT extract(year from now() at time zone 'Africa/Dakar')::int;--> statement-breakpoint
ALTER TABLE "dossier_sequences" ADD COLUMN "year" integer NOT NULL DEFAULT extract(year from now() at time zone 'Africa/Dakar')::int;--> statement-breakpoint
ALTER TABLE "declaration_sequences" ALTER COLUMN "year" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "dossier_sequences" ALTER COLUMN "year" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "declaration_sequences" ADD CONSTRAINT "declaration_sequences_organization_id_year_pk" PRIMARY KEY("organization_id","year");--> statement-breakpoint
ALTER TABLE "dossier_sequences" ADD CONSTRAINT "dossier_sequences_organization_id_year_pk" PRIMARY KEY("organization_id","year");--> statement-breakpoint
CREATE UNIQUE INDEX "dossiers_organization_id_bl_reference_unique_idx" ON "dossiers" USING btree ("organization_id","bl_reference") WHERE "dossiers"."bl_reference" IS NOT NULL;
