ALTER TABLE "rules" ALTER COLUMN "is_automatic_annulment" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "rules" drop column "is_automatic_annulment";--> statement-breakpoint
ALTER TABLE "rules" ADD COLUMN "is_automatic_annulment" boolean GENERATED ALWAYS AS (("severity" = 'ponistavanje')) STORED;