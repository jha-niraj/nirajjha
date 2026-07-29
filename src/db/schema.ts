import { sql } from "drizzle-orm";
import {
	type AnyPgColumn,
	boolean,
	index,
	integer,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";

/**
 * Per-post counters that are cheap to read on every render. Views are a plain
 * counter rather than a row-per-hit table: the index page reads them for every
 * post at once, and nobody needs to query an individual pageview later.
 */
export const postStats = pgTable("post_stats", {
	slug: varchar("slug", { length: 200 }).primaryKey(),
	views: integer("views").notNull().default(0),
	updatedAt: timestamp("updated_at", { withTimezone: true })
		.notNull()
		.defaultNow(),
});

/**
 * One row per visitor per post. The unique index is what makes a reaction
 * idempotent: switching like to dislike updates the row instead of stacking a
 * second vote, and counts are derived by aggregating rows so they cannot drift
 * the way an incremented counter would.
 *
 * visitorId is an anonymous UUID minted in localStorage. It is a
 * discouragement, not authentication, which is the right trade for a personal
 * site with no login.
 */
export const postReactions = pgTable(
	"post_reactions",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		slug: varchar("slug", { length: 200 }).notNull(),
		visitorId: varchar("visitor_id", { length: 64 }).notNull(),
		reaction: varchar("reaction", { length: 8 }).notNull(),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(t) => ({
		oncePerVisitor: uniqueIndex("post_reactions_slug_visitor_idx").on(
			t.slug,
			t.visitorId
		),
		bySlug: index("post_reactions_slug_idx").on(t.slug),
	})
);

/**
 * Threaded comments. parentId self-references, so a reply to a reply is just
 * another row: depth is a property of the tree we build at read time, not
 * something the schema caps.
 *
 * Deletes are soft. Hard-deleting a comment that has replies would either
 * orphan them or cascade them away, and neither is what a reader expects when
 * one message in the middle of a thread is removed.
 */
export const comments = pgTable(
	"comments",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		slug: varchar("slug", { length: 200 }).notNull(),
		parentId: uuid("parent_id").references((): AnyPgColumn => comments.id, {
			onDelete: "cascade",
		}),
		authorName: varchar("author_name", { length: 80 }).notNull(),
		body: text("body").notNull(),
		visitorId: varchar("visitor_id", { length: 64 }).notNull(),
		isDeleted: boolean("is_deleted").notNull().default(false),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(t) => ({
		bySlug: index("comments_slug_created_idx").on(t.slug, t.createdAt),
		byParent: index("comments_parent_idx").on(t.parentId),
		// Cheap flood guard: one identical body per visitor per post.
		noDoublePost: uniqueIndex("comments_dedupe_idx").on(
			t.slug,
			t.visitorId,
			sql`md5(${t.body})`
		),
	})
);

export type Comment = typeof comments.$inferSelect;
export type PostStat = typeof postStats.$inferSelect;

/**
 * Newsletter subscribers.
 *
 * Resend's audience is the list broadcasts actually send to, but it is a third
 * party we do not control. Keeping our own row means a Resend outage during
 * signup does not lose the address: the row lands first, `syncedAt` stays null,
 * and it can be pushed later.
 */
export const subscribers = pgTable(
	"subscribers",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		email: varchar("email", { length: 254 }).notNull(),
		/** Which page they signed up from, for judging what converts. */
		source: varchar("source", { length: 120 }),
		/** Resend contact id, null until the audience sync succeeds. */
		resendContactId: varchar("resend_contact_id", { length: 64 }),
		syncedAt: timestamp("synced_at", { withTimezone: true }),
		unsubscribed: boolean("unsubscribed").notNull().default(false),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(t) => ({
		// Plain column index rather than a `lower(email)` expression index:
		// ON CONFLICT can only target a real column, and the subscribe action
		// lowercases before it ever reaches here, so Foo@x.com and foo@x.com
		// still collapse to one row.
		uniqueEmail: uniqueIndex("subscribers_email_idx").on(t.email),
	})
);

export type Subscriber = typeof subscribers.$inferSelect;

/**
 * Registry of published posts.
 *
 * Posts are static MDX files, so nothing in the database knows they exist and
 * nothing can answer "which ones have not been emailed yet?". This table is the
 * bridge: `pnpm blog:sync` reads the frontmatter of every file and upserts a
 * row, and the broadcast step then works purely off SQL.
 *
 * It also gives every other feature a real foreign key to hang off. Views,
 * reactions and comments key on a bare slug string today; with this table they
 * have something to join against, and category/kind become filterable without
 * re-parsing markdown.
 */
export const posts = pgTable(
	"posts",
	{
		slug: varchar("slug", { length: 200 }).primaryKey(),
		title: varchar("title", { length: 300 }).notNull(),
		summary: text("summary").notNull(),
		/** Broad grouping, e.g. "Engineering". One per post. */
		category: varchar("category", { length: 80 }),
		/** Shape of the piece, e.g. "essay", "tutorial", "note". */
		kind: varchar("kind", { length: 40 }),
		tags: text("tags").array().notNull().default(sql`'{}'::text[]`),
		art: varchar("art", { length: 40 }),
		readingTime: integer("reading_time").notNull().default(1),
		publishedAt: varchar("published_at", { length: 10 }).notNull(),
		updatedAt: varchar("updated_at", { length: 10 }),
		draft: boolean("draft").notNull().default(false),
		featured: boolean("featured").notNull().default(false),

		/**
		 * Hash of the rendered body. Lets sync tell "the file changed" from
		 * "nothing happened" without diffing content, which is what a future
		 * "we updated this post" email would key off.
		 */
		contentHash: varchar("content_hash", { length: 64 }).notNull(),

		firstSeenAt: timestamp("first_seen_at", { withTimezone: true })
			.notNull()
			.defaultNow(),

		/* --- broadcast state ------------------------------------------------ */

		/** Resend broadcast id, null until this post has been emailed. */
		broadcastId: varchar("broadcast_id", { length: 64 }),
		broadcastSentAt: timestamp("broadcast_sent_at", { withTimezone: true }),
		/**
		 * Set on posts that should never be emailed: backfilled history, or
		 * anything published before the list existed. Sync can stamp this in
		 * bulk so the first real broadcast does not mail the whole archive.
		 */
		broadcastSkipped: boolean("broadcast_skipped").notNull().default(false),
	},
	(t) => ({
		// The broadcast query is "not sent, not skipped, not draft, due now",
		// so index the columns it filters on.
		pending: index("posts_broadcast_pending_idx").on(
			t.broadcastSentAt,
			t.broadcastSkipped,
			t.publishedAt
		),
	})
);

export type PostRow = typeof posts.$inferSelect;
