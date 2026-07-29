import "server-only";

import { db } from "@/db";
import { comments, postReactions, postStats } from "@/db/schema";
import { and, asc, eq, inArray, sql } from "drizzle-orm";

export type ReactionKind = "like" | "dislike";

export type PostEngagement = {
	views: number;
	likes: number;
	dislikes: number;
	/** What this visitor already picked, if anything. */
	myReaction: ReactionKind | null;
};

export const EMPTY_ENGAGEMENT: PostEngagement = {
	views: 0,
	likes: 0,
	dislikes: 0,
	myReaction: null,
};

/**
 * Reads must never take a page down with them.
 *
 * These counters are decoration on top of content that is perfectly readable
 * without them, and `next build` prerenders every post, so a database that is
 * unreachable, still migrating, or simply not configured would otherwise fail
 * the whole build. Writes are deliberately NOT wrapped: if a comment cannot be
 * saved the caller has to know.
 */
async function safeRead<T>(run: () => Promise<T>, fallback: T): Promise<T> {
	if (!db) return fallback;
	try {
		return await run();
	} catch (error) {
		console.warn("[db] read failed, serving fallback:", error);
		return fallback;
	}
}

/* -------------------------------------------------------------------------- */
/* Views                                                                       */
/* -------------------------------------------------------------------------- */

/** Increments and returns the new count. Upserts so a brand new post works. */
export async function recordView(slug: string): Promise<number> {
	if (!db) return 0;

	const [row] = await db
		.insert(postStats)
		.values({ slug, views: 1 })
		.onConflictDoUpdate({
			target: postStats.slug,
			set: {
				views: sql`${postStats.views} + 1`,
				updatedAt: new Date(),
			},
		})
		.returning({ views: postStats.views });

	return row?.views ?? 0;
}

/** View counts for many posts at once, for the index page. */
export async function getViewCounts(
	slugs: string[],
): Promise<Record<string, number>> {
	if (slugs.length === 0) return {};
	return safeRead(async () => {
		const rows = await db!
			.select({ slug: postStats.slug, views: postStats.views })
			.from(postStats)
			.where(inArray(postStats.slug, slugs));
		return Object.fromEntries(rows.map((r) => [r.slug, r.views]));
	}, {});
}

/* -------------------------------------------------------------------------- */
/* Reactions                                                                   */
/* -------------------------------------------------------------------------- */

export async function getEngagement(
	slug: string,
	visitorId?: string,
): Promise<PostEngagement> {
	return safeRead(async () => {
		// Counts are aggregated from the rows themselves, so they can never
		// disagree with what is actually stored.
		const [tallies, [stat], mine] = await Promise.all([
			db!
				.select({
					reaction: postReactions.reaction,
					count: sql<number>`count(*)::int`,
				})
				.from(postReactions)
				.where(eq(postReactions.slug, slug))
				.groupBy(postReactions.reaction),
			db!
				.select({ views: postStats.views })
				.from(postStats)
				.where(eq(postStats.slug, slug)),
			visitorId
				? db!
						.select({ reaction: postReactions.reaction })
						.from(postReactions)
						.where(
							and(
								eq(postReactions.slug, slug),
								eq(postReactions.visitorId, visitorId),
							),
						)
				: Promise.resolve([]),
		]);

		const byKind = Object.fromEntries(
			tallies.map((t) => [t.reaction, t.count]),
		);

		return {
			views: stat?.views ?? 0,
			likes: byKind.like ?? 0,
			dislikes: byKind.dislike ?? 0,
			myReaction: (mine[0]?.reaction as ReactionKind | undefined) ?? null,
		};
	}, EMPTY_ENGAGEMENT);
}

/**
 * Toggles a reaction. Picking the same one again clears it, picking the other
 * one switches it. Returns the fresh tallies so the client never has to guess.
 */
export async function setReaction(
	slug: string,
	visitorId: string,
	reaction: ReactionKind,
): Promise<PostEngagement> {
	if (!db) return EMPTY_ENGAGEMENT;

	const existing = await db
		.select({ reaction: postReactions.reaction })
		.from(postReactions)
		.where(
			and(eq(postReactions.slug, slug), eq(postReactions.visitorId, visitorId)),
		);

	if (existing[0]?.reaction === reaction) {
		await db
			.delete(postReactions)
			.where(
				and(
					eq(postReactions.slug, slug),
					eq(postReactions.visitorId, visitorId),
				),
			);
	} else {
		await db
			.insert(postReactions)
			.values({ slug, visitorId, reaction })
			.onConflictDoUpdate({
				target: [postReactions.slug, postReactions.visitorId],
				set: { reaction, createdAt: new Date() },
			});
	}

	return getEngagement(slug, visitorId);
}

/* -------------------------------------------------------------------------- */
/* Comments                                                                    */
/* -------------------------------------------------------------------------- */

export type CommentNode = {
	id: string;
	parentId: string | null;
	authorName: string;
	body: string;
	createdAt: string;
	isDeleted: boolean;
	isMine: boolean;
	replies: CommentNode[];
};

/**
 * Reads the whole thread for a post in one query and assembles the tree in
 * memory. A post's comment count is small enough that one flat read beats a
 * recursive CTE, and it keeps arbitrary reply depth free.
 */
export async function getComments(
	slug: string,
	visitorId?: string,
): Promise<CommentNode[]> {
	return safeRead(async () => {
		const rows = await db!
			.select()
			.from(comments)
			.where(eq(comments.slug, slug))
			.orderBy(asc(comments.createdAt));

		const nodes = new Map<string, CommentNode>();
		for (const row of rows) {
			nodes.set(row.id, {
				id: row.id,
				parentId: row.parentId,
				authorName: row.authorName,
				// A soft-deleted comment keeps its place in the thread so replies
				// underneath it still make sense.
				body: row.isDeleted ? "" : row.body,
				createdAt: row.createdAt.toISOString(),
				isDeleted: row.isDeleted,
				isMine: Boolean(visitorId) && row.visitorId === visitorId,
				replies: [],
			});
		}

		const roots: CommentNode[] = [];
		for (const node of nodes.values()) {
			const parent = node.parentId ? nodes.get(node.parentId) : undefined;
			if (parent) parent.replies.push(node);
			else roots.push(node);
		}

		// Newest thread first at the top level, oldest first inside a thread so a
		// conversation reads downwards.
		roots.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
		return roots;
	}, []);
}

export async function getCommentCount(slug: string): Promise<number> {
	return safeRead(async () => {
		const [row] = await db!
			.select({ count: sql<number>`count(*)::int` })
			.from(comments)
			.where(and(eq(comments.slug, slug), eq(comments.isDeleted, false)));
		return row?.count ?? 0;
	}, 0);
}

export async function getCommentCounts(
	slugs: string[],
): Promise<Record<string, number>> {
	if (slugs.length === 0) return {};
	return safeRead(async () => {
		const rows = await db!
			.select({ slug: comments.slug, count: sql<number>`count(*)::int` })
			.from(comments)
			.where(and(inArray(comments.slug, slugs), eq(comments.isDeleted, false)))
			.groupBy(comments.slug);
		return Object.fromEntries(rows.map((r) => [r.slug, r.count]));
	}, {});
}

export async function addComment(input: {
	slug: string;
	parentId: string | null;
	authorName: string;
	body: string;
	visitorId: string;
}): Promise<CommentNode[]> {
	if (!db) return [];

	// A reply must belong to the same post as its parent, otherwise a crafted
	// parentId could graft a thread from one post onto another.
	if (input.parentId) {
		const [parent] = await db
			.select({ slug: comments.slug })
			.from(comments)
			.where(eq(comments.id, input.parentId));
		if (!parent || parent.slug !== input.slug) {
			throw new Error("Invalid parent comment");
		}
	}

	await db
		.insert(comments)
		.values({
			slug: input.slug,
			parentId: input.parentId,
			authorName: input.authorName,
			body: input.body,
			visitorId: input.visitorId,
		})
		// The dedupe index turns an accidental double submit into a no-op
		// rather than an error page.
		.onConflictDoNothing();

	return getComments(input.slug, input.visitorId);
}

export async function deleteComment(
	id: string,
	visitorId: string,
): Promise<void> {
	if (!db) return;
	await db
		.update(comments)
		.set({ isDeleted: true, body: "" })
		.where(and(eq(comments.id, id), eq(comments.visitorId, visitorId)));
}
