CREATE TABLE "posts" (
	"slug" varchar(200) PRIMARY KEY NOT NULL,
	"title" varchar(300) NOT NULL,
	"summary" text NOT NULL,
	"category" varchar(80),
	"kind" varchar(40),
	"tags" text[] DEFAULT '{}'::text[] NOT NULL,
	"art" varchar(40),
	"reading_time" integer DEFAULT 1 NOT NULL,
	"published_at" varchar(10) NOT NULL,
	"updated_at" varchar(10),
	"draft" boolean DEFAULT false NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"content_hash" varchar(64) NOT NULL,
	"first_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"broadcast_id" varchar(64),
	"broadcast_sent_at" timestamp with time zone,
	"broadcast_skipped" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE INDEX "posts_broadcast_pending_idx" ON "posts" USING btree ("broadcast_sent_at","broadcast_skipped","published_at");