ALTER TABLE "dataset_files" ALTER COLUMN "dataset_version_id" SET DATA TYPE varchar(64);--> statement-breakpoint
ALTER TABLE "dataset_versions" ALTER COLUMN "id" SET DATA TYPE varchar(64);