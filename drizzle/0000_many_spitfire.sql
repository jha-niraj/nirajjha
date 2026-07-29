CREATE TABLE "comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(200) NOT NULL,
	"parent_id" uuid,
	"author_name" varchar(80) NOT NULL,
	"body" text NOT NULL,
	"visitor_id" varchar(64) NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "post_reactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(200) NOT NULL,
	"visitor_id" varchar(64) NOT NULL,
	"reaction" varchar(8) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "post_stats" (
	"slug" varchar(200) PRIMARY KEY NOT NULL,
	"views" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_parent_id_comments_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."comments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "comments_slug_created_idx" ON "comments" USING btree ("slug","created_at");--> statement-breakpoint
CREATE INDEX "comments_parent_idx" ON "comments" USING btree ("parent_id");--> statement-breakpoint
CREATE UNIQUE INDEX "comments_dedupe_idx" ON "comments" USING btree ("slug","visitor_id",md5("body"));--> statement-breakpoint
CREATE UNIQUE INDEX "post_reactions_slug_visitor_idx" ON "post_reactions" USING btree ("slug","visitor_id");--> statement-breakpoint
CREATE INDEX "post_reactions_slug_idx" ON "post_reactions" USING btree ("slug");