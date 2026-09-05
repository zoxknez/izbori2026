ALTER TABLE "decision_trees" ALTER COLUMN "review_status" SET DEFAULT 'legal_review';--> statement-breakpoint
ALTER TABLE "rules" ALTER COLUMN "review_status" SET DEFAULT 'legal_review';
--> statement-breakpoint
UPDATE "rules" SET "review_status" = 'legal_review' WHERE "review_status" = 'REVIEW_REQUIRED';
--> statement-breakpoint
UPDATE "decision_trees" SET "review_status" = 'legal_review' WHERE "review_status" = 'REVIEW_REQUIRED';
