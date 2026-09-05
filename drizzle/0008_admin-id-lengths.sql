ALTER TABLE "admin_users" ALTER COLUMN "id" SET DATA TYPE varchar(64);--> statement-breakpoint
ALTER TABLE "audit_log" ALTER COLUMN "actor_user_id" SET DATA TYPE varchar(64);