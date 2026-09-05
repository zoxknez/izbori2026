ALTER TABLE "rules" ADD COLUMN IF NOT EXISTS "aliases" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "rules" ADD COLUMN IF NOT EXISTS "informal_queries" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "sources" ADD COLUMN IF NOT EXISTS "type" varchar(32) DEFAULT 'reference' NOT NULL;
