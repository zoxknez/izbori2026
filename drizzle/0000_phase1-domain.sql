CREATE TABLE IF NOT EXISTS "criminal_articles" (
	"id" varchar(16) PRIMARY KEY NOT NULL,
	"article" varchar(16) NOT NULL,
	"naziv" text NOT NULL,
	"opis" text NOT NULL,
	"primer" text NOT NULL,
	"nije_dokaz" text,
	"kazna" text NOT NULL,
	"order" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "decision_nodes" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"tree_id" varchar(32) NOT NULL,
	"type" varchar(16) NOT NULL,
	"prompt" text NOT NULL,
	"options" jsonb DEFAULT '[]'::jsonb,
	"rule_ids" jsonb DEFAULT '[]'::jsonb,
	"order" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "decision_trees" (
	"id" varchar(32) PRIMARY KEY NOT NULL,
	"slug" varchar(160) NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"start_node_id" varchar(64) NOT NULL,
	"publication_status" varchar(32) DEFAULT 'published',
	"review_status" varchar(32) DEFAULT 'REVIEW_REQUIRED',
	"order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "decision_trees_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "rules" (
	"id" varchar(16) PRIMARY KEY NOT NULL,
	"slug" varchar(160) NOT NULL,
	"naziv" text NOT NULL,
	"kategorija" varchar(64) NOT NULL,
	"severity" varchar(32) NOT NULL,
	"election_types" jsonb NOT NULL,
	"phase" varchar(64) NOT NULL,
	"phases" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"summary" text NOT NULL,
	"legal_rule" text NOT NULL,
	"legal_effect" text,
	"what_to_check" jsonb DEFAULT '[]'::jsonb,
	"controller_actions" jsonb DEFAULT '[]'::jsonb,
	"voter_actions" jsonb DEFAULT '[]'::jsonb,
	"observer_actions" jsonb DEFAULT '[]'::jsonb,
	"evidence_checklist" jsonb DEFAULT '[]'::jsonb,
	"do_not_do" jsonb DEFAULT '[]'::jsonb,
	"law_references" jsonb DEFAULT '[]'::jsonb,
	"source_urls" jsonb DEFAULT '[]'::jsonb,
	"related_slugs" jsonb DEFAULT '[]'::jsonb,
	"myth_check" jsonb DEFAULT 'null'::jsonb,
	"is_automatic_annulment" boolean DEFAULT false,
	"order" integer DEFAULT 0,
	"review_status" varchar(32) DEFAULT 'REVIEW_REQUIRED',
	"publication_status" varchar(32) DEFAULT 'published',
	"last_legal_review" varchar(32),
	"valid_from" varchar(32),
	"valid_until" varchar(32),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "rules_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sources" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"tier" integer NOT NULL,
	"label" text NOT NULL,
	"url" text NOT NULL,
	"description" text,
	"order" integer DEFAULT 0,
	"publisher" text,
	"version" varchar(64),
	"valid_from_date" date,
	"valid_until_date" date,
	"status" varchar(32) DEFAULT 'active',
	"supersedes_id" varchar(64),
	"last_checked_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "rules" ADD COLUMN IF NOT EXISTS "phases" jsonb DEFAULT '[]'::jsonb NOT NULL;
--> statement-breakpoint
ALTER TABLE "rules" ADD COLUMN IF NOT EXISTS "publication_status" varchar(32) DEFAULT 'published';
--> statement-breakpoint
ALTER TABLE "sources" ADD COLUMN IF NOT EXISTS "publisher" text;
--> statement-breakpoint
ALTER TABLE "sources" ADD COLUMN IF NOT EXISTS "version" varchar(64);
--> statement-breakpoint
ALTER TABLE "sources" ADD COLUMN IF NOT EXISTS "valid_from_date" date;
--> statement-breakpoint
ALTER TABLE "sources" ADD COLUMN IF NOT EXISTS "valid_until_date" date;
--> statement-breakpoint
ALTER TABLE "sources" ADD COLUMN IF NOT EXISTS "status" varchar(32) DEFAULT 'active';
--> statement-breakpoint
ALTER TABLE "sources" ADD COLUMN IF NOT EXISTS "supersedes_id" varchar(64);
--> statement-breakpoint
ALTER TABLE "sources" ADD COLUMN IF NOT EXISTS "last_checked_at" timestamp;
--> statement-breakpoint
UPDATE "rules" SET "phases" = jsonb_build_array("phase") WHERE "phases" = '[]'::jsonb;
