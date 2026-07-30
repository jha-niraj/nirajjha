CREATE TABLE "post_views_daily" (
	"slug" varchar(200) NOT NULL,
	"day" varchar(10) NOT NULL,
	"views" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "post_views_daily_slug_day_idx" ON "post_views_daily" USING btree ("slug","day");--> statement-breakpoint
CREATE INDEX "post_views_daily_day_idx" ON "post_views_daily" USING btree ("day");