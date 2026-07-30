ALTER TABLE "contributor_applications" ADD COLUMN "challenge_id" varchar(40);--> statement-breakpoint
ALTER TABLE "contributor_applications" ADD COLUMN "source" varchar(20);--> statement-breakpoint
ALTER TABLE "contributor_applications" ADD COLUMN "source_detail" varchar(200);--> statement-breakpoint
ALTER TABLE "contributor_applications" ADD COLUMN "decided_at" timestamp with time zone;