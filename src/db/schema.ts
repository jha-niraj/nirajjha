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
		/**
		 * What the thread hangs off. `subjectType` plus `slug` is the key: a post
		 * slug, or an idea slug.
		 *
		 * Generalised rather than given a second table. Threading, soft delete,
		 * ownership and the flood guard below are all already here and all
		 * behave identically for an idea; duplicating them would mean two comment
		 * systems to keep in step forever.
		 */
		subjectType: varchar("subject_type", { length: 12 })
			.notNull()
			.default("post"),
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
		bySlug: index("comments_slug_created_idx").on(
			t.subjectType,
			t.slug,
			t.createdAt
		),
		byParent: index("comments_parent_idx").on(t.parentId),
		// Cheap flood guard: one identical body per visitor per subject.
		noDoublePost: uniqueIndex("comments_dedupe_idx").on(
			t.subjectType,
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

/**
 * Applications to contribute to the open-source project.
 *
 * Deliberately a queue, not an onboarding flow. Nobody gets access by filling
 * this in: a row here means "read this and decide", and the actual invite
 * happens by hand in SyncHq afterwards. That ordering is the whole point, since
 * a contributor lands in a workspace alongside real client work.
 */
export const contributorApplications = pgTable(
	"contributor_applications",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		name: varchar("name", { length: 120 }).notNull(),
		email: varchar("email", { length: 254 }).notNull(),
		/** GitHub handle, stored bare (no URL) so it can be matched to a PR author. */
		github: varchar("github", { length: 80 }).notNull(),
		/** Anything they want read: resume, portfolio, a repo. */
		linkUrl: varchar("link_url", { length: 500 }),

		/**
		 * Which problem from data/challenges.ts they chose to answer, and their
		 * answer. This replaced a "why do you want to join" box: a motivation
		 * letter measures how well somebody writes motivation letters, whereas
		 * reasoning about an unfamiliar system is the thing that actually
		 * predicts whether a contributor works out.
		 */
		challengeId: varchar("challenge_id", { length: 40 }),
		pitch: text("pitch").notNull(),

		/** Free text: "final year CS", "self taught, 2 years", whatever they say. */
		background: varchar("background", { length: 200 }),

		/**
		 * How they found the project, and the free-text detail (which post, which
		 * university). Captured on day one because it is impossible to
		 * reconstruct later and it is the only way to know what actually works.
		 */
		source: varchar("source", { length: 20 }),
		sourceDetail: varchar("source_detail", { length: 200 }),

		/** pending | reviewing | invited | declined */
		status: varchar("status", { length: 20 }).notNull().default("pending"),
		/**
		 * Why the decision went the way it did. Worth filling in even for a no:
		 * six months from now the only way to know whether these calls were any
		 * good is to have written down the reasoning at the time.
		 */
		reviewNote: text("review_note"),
		decidedAt: timestamp("decided_at", { withTimezone: true }),

		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(t) => ({
		// One open application per person. Re-applying updates the existing row
		// rather than filling the queue with duplicates.
		oneEmail: uniqueIndex("contributor_applications_email_idx").on(t.email),
		byStatus: index("contributor_applications_status_idx").on(
			t.status,
			t.createdAt
		),
	})
);

export type ContributorApplication = typeof contributorApplications.$inferSelect;

/* -------------------------------------------------------------------------- */
/* Auth                                                                        */
/*                                                                             */
/* Better Auth's own tables, shaped the way its Drizzle adapter expects. There  */
/* is exactly one account here: the admin panel is a private dashboard, not a   */
/* product with users, so there is no signup route anywhere in the app and the  */
/* only way a row lands in `user` is `pnpm admin:seed`.                         */
/* -------------------------------------------------------------------------- */

export const user = pgTable("user", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	email: text("email").notNull().unique(),
	emailVerified: boolean("email_verified").notNull().default(false),
	image: text("image"),
	/** Gate for the admin area. Checked on every /admin request. */
	role: text("role").notNull().default("admin"),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const session = pgTable("session", {
	id: text("id").primaryKey(),
	expiresAt: timestamp("expires_at").notNull(),
	token: text("token").notNull().unique(),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
	id: text("id").primaryKey(),
	accountId: text("account_id").notNull(),
	providerId: text("provider_id").notNull(),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	accessToken: text("access_token"),
	refreshToken: text("refresh_token"),
	idToken: text("id_token"),
	accessTokenExpiresAt: timestamp("access_token_expires_at"),
	refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
	scope: text("scope"),
	/** Scrypt hash written by Better Auth. Never a plaintext password. */
	password: text("password"),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const verification = pgTable("verification", {
	id: text("id").primaryKey(),
	identifier: text("identifier").notNull(),
	value: text("value").notNull(),
	expiresAt: timestamp("expires_at").notNull(),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/**
 * One row per post per day.
 *
 * `post_stats.views` is a running total and can only ever answer "how many".
 * A dashboard needs "how many, when", and you cannot recover a time series from
 * a counter after the fact. Upserted alongside the counter on every view.
 */
export const postViewsDaily = pgTable(
	"post_views_daily",
	{
		slug: varchar("slug", { length: 200 }).notNull(),
		/** Date only, as YYYY-MM-DD, so a day is one row regardless of timezone. */
		day: varchar("day", { length: 10 }).notNull(),
		views: integer("views").notNull().default(0),
	},
	(t) => ({
		onePerDay: uniqueIndex("post_views_daily_slug_day_idx").on(t.slug, t.day),
		byDay: index("post_views_daily_day_idx").on(t.day),
	})
);

/* -------------------------------------------------------------------------- */
/* Ideas                                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Open-source project ideas, proposed by anyone.
 *
 * Nothing here is visible until it is published. A public submission form
 * collects spam within days, and a board of raw submissions is a junk list
 * rather than something worth coming back to, so `pending` is the only state a
 * submission can create and every page filters on status.
 *
 * `reviewNote` is public on purpose. An idea that was turned down saying why is
 * the difference between a suggestion box nobody reads and a board that teaches
 * the next person what a good proposal looks like.
 */
export const projectIdeas = pgTable(
	"project_ideas",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		slug: varchar("slug", { length: 120 }).notNull().unique(),
		title: varchar("title", { length: 160 }).notNull(),

		/** What is broken today. */
		problem: text("problem").notNull(),
		/** What should exist instead. */
		proposal: text("proposal").notNull(),
		/** Who it is for. */
		audience: varchar("audience", { length: 200 }),
		stack: text("stack").array().notNull().default(sql`'{}'::text[]`),
		/** weekend | weeks | big */
		scope: varchar("scope", { length: 20 }).notNull().default("weeks"),

		proposerName: varchar("proposer_name", { length: 120 }).notNull(),
		proposerEmail: varchar("proposer_email", { length: 254 }).notNull(),
		proposerGithub: varchar("proposer_github", { length: 39 }),

		/** pending | published | building | shipped | rejected */
		status: varchar("status", { length: 20 }).notNull().default("pending"),
		/** Shown publicly once decided. Says what happened and why. */
		reviewNote: text("review_note"),
		/** The SyncHq project, once one exists. Closes the loop in public. */
		projectUrl: varchar("project_url", { length: 500 }),

		/** Reuses the post artwork set, so a card never needs an image. */
		art: varchar("art", { length: 40 }),

		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		publishedAt: timestamp("published_at", { withTimezone: true }),
		decidedAt: timestamp("decided_at", { withTimezone: true }),
	},
	(t) => ({
		byStatus: index("project_ideas_status_idx").on(t.status, t.createdAt),
	})
);

/**
 * One row per visitor per idea.
 *
 * Interest, not a ballot. The unique index makes it idempotent; clearing the
 * cookie buys one more vote, which is the same discouragement-not-identity
 * trade the reactions make. Counts are derived from these rows rather than
 * incremented on the idea, so they cannot drift.
 */
export const ideaVotes = pgTable(
	"idea_votes",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		ideaId: uuid("idea_id")
			.notNull()
			.references(() => projectIdeas.id, { onDelete: "cascade" }),
		visitorId: varchar("visitor_id", { length: 64 }).notNull(),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(t) => ({
		oncePerVisitor: uniqueIndex("idea_votes_idea_visitor_idx").on(
			t.ideaId,
			t.visitorId
		),
		byIdea: index("idea_votes_idea_idx").on(t.ideaId),
	})
);

export type ProjectIdea = typeof projectIdeas.$inferSelect;
