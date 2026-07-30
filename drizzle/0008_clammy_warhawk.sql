CREATE TABLE "idea_votes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"idea_id" uuid NOT NULL,
	"visitor_id" varchar(64) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_ideas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(120) NOT NULL,
	"title" varchar(160) NOT NULL,
	"problem" text NOT NULL,
	"proposal" text NOT NULL,
	"audience" varchar(200),
	"stack" text[] DEFAULT '{}'::text[] NOT NULL,
	"scope" varchar(20) DEFAULT 'weeks' NOT NULL,
	"proposer_name" varchar(120) NOT NULL,
	"proposer_email" varchar(254) NOT NULL,
	"proposer_github" varchar(39),
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"review_note" text,
	"project_url" varchar(500),
	"art" varchar(40),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"published_at" timestamp with time zone,
	"decided_at" timestamp with time zone,
	CONSTRAINT "project_ideas_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
DROP INDEX "comments_slug_created_idx";--> statement-breakpoint
DROP INDEX "comments_dedupe_idx";--> statement-breakpoint
ALTER TABLE "comments" ADD COLUMN "subject_type" varchar(12) DEFAULT 'post' NOT NULL;--> statement-breakpoint
ALTER TABLE "idea_votes" ADD CONSTRAINT "idea_votes_idea_id_project_ideas_id_fk" FOREIGN KEY ("idea_id") REFERENCES "public"."project_ideas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "idea_votes_idea_visitor_idx" ON "idea_votes" USING btree ("idea_id","visitor_id");--> statement-breakpoint
CREATE INDEX "idea_votes_idea_idx" ON "idea_votes" USING btree ("idea_id");--> statement-breakpoint
CREATE INDEX "project_ideas_status_idx" ON "project_ideas" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "comments_slug_created_idx" ON "comments" USING btree ("subject_type","slug","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "comments_dedupe_idx" ON "comments" USING btree ("subject_type","slug","visitor_id",md5("body"));