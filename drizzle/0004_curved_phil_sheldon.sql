CREATE TABLE "contributor_applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(120) NOT NULL,
	"email" varchar(254) NOT NULL,
	"github" varchar(80) NOT NULL,
	"link_url" varchar(500),
	"pitch" text NOT NULL,
	"background" varchar(200),
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"review_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "contributor_applications_email_idx" ON "contributor_applications" USING btree ("email");--> statement-breakpoint
CREATE INDEX "contributor_applications_status_idx" ON "contributor_applications" USING btree ("status","created_at");