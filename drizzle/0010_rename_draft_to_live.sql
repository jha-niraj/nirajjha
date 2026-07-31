-- `draft` became `live`: publishing is now opt in rather than opt out.
-- Renamed rather than dropped and re-added so no row loses its state, then
-- inverted, because draft = false meant the post was public.
ALTER TABLE "posts" RENAME COLUMN "draft" TO "live";--> statement-breakpoint
UPDATE "posts" SET "live" = NOT "live";
