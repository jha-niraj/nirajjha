import "server-only";

import { db } from "@/db";
import {
	comments,
	contributorApplications,
	postReactions,
	postStats,
	postViewsDaily,
	posts,
	subscribers,
} from "@/db/schema";
import { and, count, desc, eq, sql } from "drizzle-orm";

/**
 * Read models for the admin panel.
 *
 * Everything here aggregates in SQL rather than pulling rows and counting in
 * JavaScript. The volumes are small enough that it would not matter yet, which
 * is exactly why it is worth doing now: the shape of these queries is what
 * decides whether the dashboard still opens in 200ms at ten thousand rows.
 */

export type Overview = {
	views: number;
	likes: number;
	dislikes: number;
	comments: number;
	subscribers: number;
	pendingApplications: number;
	posts: number;
};

const EMPTY: Overview = {
	views: 0,
	likes: 0,
	dislikes: 0,
	comments: 0,
	subscribers: 0,
	pendingApplications: 0,
	posts: 0,
};

async function safe<T>(run: () => Promise<T>, fallback: T): Promise<T> {
	if (!db) return fallback;
	try {
		return await run();
	} catch (error) {
		console.warn("[analytics] read failed:", error);
		return fallback;
	}
}

export async function getOverview(): Promise<Overview> {
	return safe(async () => {
		const [[views], reactions, [commentCount], [subs], [pending], [postCount]] =
			await Promise.all([
				db!
					.select({ total: sql<number>`coalesce(sum(${postStats.views}), 0)::int` })
					.from(postStats),
				db!
					.select({
						reaction: postReactions.reaction,
						n: sql<number>`count(*)::int`,
					})
					.from(postReactions)
					.groupBy(postReactions.reaction),
				db!
					.select({ n: sql<number>`count(*)::int` })
					.from(comments)
					.where(eq(comments.isDeleted, false)),
				db!
					.select({ n: sql<number>`count(*)::int` })
					.from(subscribers)
					.where(eq(subscribers.unsubscribed, false)),
				db!
					.select({ n: sql<number>`count(*)::int` })
					.from(contributorApplications)
					.where(eq(contributorApplications.status, "pending")),
				db!.select({ n: sql<number>`count(*)::int` }).from(posts),
			]);

		const byKind = Object.fromEntries(reactions.map((r) => [r.reaction, r.n]));

		return {
			views: views?.total ?? 0,
			likes: byKind.like ?? 0,
			dislikes: byKind.dislike ?? 0,
			comments: commentCount?.n ?? 0,
			subscribers: subs?.n ?? 0,
			pendingApplications: pending?.n ?? 0,
			posts: postCount?.n ?? 0,
		};
	}, EMPTY);
}

export type PostRow = {
	slug: string;
	title: string;
	category: string | null;
	publishedAt: string;
	readingTime: number;
	views: number;
	likes: number;
	dislikes: number;
	comments: number;
};

/**
 * One row per post with every counter attached.
 *
 * Left joins onto pre-aggregated subqueries rather than joining the raw tables:
 * joining reactions and comments directly would multiply rows against each
 * other and inflate both counts, which is the classic fan-out bug.
 */
export async function getPostAnalytics(): Promise<PostRow[]> {
	return safe(async () => {
		const rows = await db!.execute(sql`
			select
				p.slug,
				p.title,
				p.category,
				p.published_at            as "publishedAt",
				p.reading_time            as "readingTime",
				coalesce(s.views, 0)::int as views,
				coalesce(r.likes, 0)::int as likes,
				coalesce(r.dislikes, 0)::int as dislikes,
				coalesce(c.n, 0)::int     as comments
			from posts p
			left join post_stats s on s.slug = p.slug
			left join (
				select slug,
					count(*) filter (where reaction = 'like')    as likes,
					count(*) filter (where reaction = 'dislike') as dislikes
				from post_reactions group by slug
			) r on r.slug = p.slug
			left join (
				select slug, count(*) as n from comments
				where is_deleted = false group by slug
			) c on c.slug = p.slug
			order by coalesce(s.views, 0) desc, p.published_at desc
		`);
		return rows.rows as unknown as PostRow[];
	}, []);
}

export async function getPostDetail(slug: string) {
	return safe(
		async () => {
			const [row] = (
				await db!.execute(sql`
					select
						p.slug, p.title, p.summary, p.category, p.kind, p.tags,
						p.published_at as "publishedAt", p.reading_time as "readingTime",
						p.broadcast_sent_at as "broadcastSentAt",
						coalesce(s.views, 0)::int as views,
						coalesce(r.likes, 0)::int as likes,
						coalesce(r.dislikes, 0)::int as dislikes
					from posts p
					left join post_stats s on s.slug = p.slug
					left join (
						select slug,
							count(*) filter (where reaction = 'like')    as likes,
							count(*) filter (where reaction = 'dislike') as dislikes
						from post_reactions group by slug
					) r on r.slug = p.slug
					where p.slug = ${slug}
				`)
			).rows as unknown as (PostRow & {
				summary: string;
				kind: string | null;
				tags: string[];
				broadcastSentAt: string | null;
			})[];

			if (!row) return null;

			const thread = await db!
				.select()
				.from(comments)
				.where(eq(comments.slug, slug))
				.orderBy(desc(comments.createdAt));

			return { post: row, comments: thread };
		},
		null
	);
}

export async function getApplications(status?: string) {
	return safe(async () => {
		const q = db!.select().from(contributorApplications);
		const rows = status
			? await q
					.where(eq(contributorApplications.status, status))
					.orderBy(desc(contributorApplications.createdAt))
			: await q.orderBy(desc(contributorApplications.createdAt));
		return rows;
	}, []);
}

export async function getApplicationCounts() {
	return safe(async () => {
		const rows = await db!
			.select({
				status: contributorApplications.status,
				n: count(),
			})
			.from(contributorApplications)
			.groupBy(contributorApplications.status);
		return Object.fromEntries(rows.map((r) => [r.status, Number(r.n)]));
	}, {} as Record<string, number>);
}

export async function getRecentSubscribers(limit = 10) {
	return safe(
		async () =>
			db!
				.select()
				.from(subscribers)
				.where(eq(subscribers.unsubscribed, false))
				.orderBy(desc(subscribers.createdAt))
				.limit(limit),
		[]
	);
}

export async function getRecentComments(limit = 10) {
	return safe(
		async () =>
			db!
				.select()
				.from(comments)
				.where(and(eq(comments.isDeleted, false)))
				.orderBy(desc(comments.createdAt))
				.limit(limit),
		[]
	);
}

export type Point = { label: string; value: number };

/**
 * Views per day for the last `days` days, zero-filled.
 *
 * The zero fill matters: without it a quiet Tuesday is missing rather than
 * zero, and a line chart would join Monday straight to Wednesday and draw a
 * trend that never happened.
 */
export async function getDailyViews(days = 30, slug?: string): Promise<Point[]> {
	const rows = await safe(async () => {
		const since = new Date(Date.now() - days * 86400000)
			.toISOString()
			.slice(0, 10);

		const result = await db!.execute(sql`
			select day, sum(views)::int as views
			from post_views_daily
			where day >= ${since}
			${slug ? sql`and slug = ${slug}` : sql``}
			group by day
			order by day asc
		`);
		return result.rows as unknown as { day: string; views: number }[];
	}, [] as { day: string; views: number }[]);

	const byDay = new Map(rows.map((r) => [r.day, r.views]));
	const out: Point[] = [];

	for (let i = days - 1; i >= 0; i--) {
		const date = new Date(Date.now() - i * 86400000);
		const key = date.toISOString().slice(0, 10);
		out.push({
			label: date.toLocaleDateString("en-GB", {
				day: "numeric",
				month: "short",
			}),
			value: byDay.get(key) ?? 0,
		});
	}

	return out;
}

/** Where subscribers and applicants are coming from. */
export async function getSourceBreakdown() {
	return safe(async () => {
		const result = await db!.execute(sql`
			select coalesce(source, 'unknown') as source, count(*)::int as n
			from contributor_applications
			group by 1 order by n desc
		`);
		return result.rows as unknown as { source: string; n: number }[];
	}, []);
}
