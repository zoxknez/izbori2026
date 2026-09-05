CREATE TABLE IF NOT EXISTS "dataset_files" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"dataset_version_id" varchar(32) NOT NULL,
	"filename" varchar(160) NOT NULL,
	"payload" jsonb NOT NULL,
	"sha256" varchar(128) NOT NULL,
	"size" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "dataset_versions" (
	"id" varchar(32) PRIMARY KEY NOT NULL,
	"version" varchar(64) NOT NULL,
	"status" varchar(16) DEFAULT 'draft' NOT NULL,
	"update_priority" varchar(16) DEFAULT 'normal' NOT NULL,
	"legal_review_date" date,
	"manifest_hash" varchar(128) NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"published_at" timestamp,
	"published_by" varchar(64),
	CONSTRAINT "dataset_versions_version_unique" UNIQUE("version")
);
