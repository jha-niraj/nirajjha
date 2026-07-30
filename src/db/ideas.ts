import "server-only";

import { db } from "@/db";
import { ideaVotes, projectIdeas } from "@/db/schema";
import { and, desc, eq, inArray, sql } from "drizzle-orm";

export type IdeaStatus =
	| "pending"
	| "published"
	| "building"
	| "shipped"
	| "rejected";

/** Statuses the public board will render. Everything else is invisible. */
export const PUBLIC_STATUSES: IdeaStatus[] = [
	"published",
	"building",
	"shipped",
	"rejected",
];

export type IdeaView = {
	id: string;
	slug: string;
	title: string;
	problem: string;
	proposal: string;
	audience: string | null;
	stack: string[];
	scope: string;
	proposerName: string;
	proposerGithub: string | null;
	status: string;
	reviewNote: string | null;
	projectUrl: string | null;
	art: string | null;
	createdAt: string;
	votes: number;
	/** Whether the current visitor has already voted. */
	voted: boolean;
};

async function safe<T>(run: () => Promise<T>, fallback: T): Promise<T> {
	if (!db) return fallback;
	try {
		return await run();
	} catch (error) {
		console.warn("[ideas] read failed:", error);
		return fallback;
	}
}

/**
 * Vote counts come from a grouped subquery joined onto the ideas, not from a
 * counter column. A denormalised count drifts the first time a delete or a
 * retry is not mirrored; this cannot.
 */
export async function listIdeas(
	visitorId: string | null,
	statuses: string[] = PUBLIC_STATUSES
): Promise<IdeaView[]> {
	return safe(async () => {
		const rows = await db!
			.select({
				idea: projectIdeas,
				votes: sql<number>`(
					select count(*)::int from idea_votes v where v.idea_id = ${projectIdeas.id}
				)`,
				voted: visitorId
					? sql<boolean>`exists(
							select 1 from idea_votes v
							where v.idea_id = ${projectIdeas.id} and v.visitor_id = ${visitorId}
						)`
					: sql<boolean>`false`,
			})
			.from(projectIdeas)
			.where(inArray(projectIdeas.status, statuses))
			.orderBy(desc(projectIdeas.createdAt));

		return rows.map(({ idea, votes, voted }) => toView(idea, votes, voted));
	}, []);
}

export async function getIdea(
	slug: string,
	visitorId: string | null
): Promise<IdeaView | null> {
	return safe(async () => {
		const [row] = await db!
			.select({
				idea: projectIdeas,
				votes: sql<number>`(
					select count(*)::int from idea_votes v where v.idea_id = ${projectIdeas.id}
				)`,
				voted: visitorId
					? sql<boolean>`exists(
							select 1 from idea_votes v
							where v.idea_id = ${projectIdeas.id} and v.visitor_id = ${visitorId}
						)`
					: sql<boolean>`false`,
			})
			.from(projectIdeas)
			.where(eq(projectIdeas.slug, slug));

		return row ? toView(row.idea, row.votes, row.voted) : null;
	}, null);
}

/** Slugs that exist and are publicly visible, for validating a comment target. */
export async function getPublicIdeaSlugs(): Promise<Set<string>> {
	return safe(async () => {
		const rows = await db!
			.select({ slug: projectIdeas.slug })
			.from(projectIdeas)
			.where(inArray(projectIdeas.status, PUBLIC_STATUSES));
		return new Set(rows.map((r) => r.slug));
	}, new Set<string>());
}

/** Toggles interest. Returns the fresh count so the client never guesses. */
export async function toggleVote(
	slug: string,
	visitorId: string
): Promise<{ votes: number; voted: boolean }> {
	if (!db) return { votes: 0, voted: false };

	const [idea] = await db!
		.select({ id: projectIdeas.id, status: projectIdeas.status })
		.from(projectIdeas)
		.where(eq(projectIdeas.slug, slug));

	if (!idea || !PUBLIC_STATUSES.includes(idea.status as IdeaStatus)) {
		throw new Error("Unknown idea");
	}

	const existing = await db!
		.select({ id: ideaVotes.id })
		.from(ideaVotes)
		.where(
			and(eq(ideaVotes.ideaId, idea.id), eq(ideaVotes.visitorId, visitorId))
		);

	if (existing.length > 0) {
		await db!.delete(ideaVotes).where(eq(ideaVotes.id, existing[0].id));
	} else {
		await db!
			.insert(ideaVotes)
			.values({ ideaId: idea.id, visitorId })
			// A double-click sends two requests; the unique index turns the
			// second into a no-op instead of an error page.
			.onConflictDoNothing();
	}

	const [{ n }] = await db!
		.select({ n: sql<number>`count(*)::int` })
		.from(ideaVotes)
		.where(eq(ideaVotes.ideaId, idea.id));

	return { votes: n, voted: existing.length === 0 };
}

/* -------------------------------------------------------------------------- */
/* Admin                                                                       */
/* -------------------------------------------------------------------------- */

export async function listAllIdeas(status?: string) {
	return safe(async () => {
		const base = db!
			.select({
				idea: projectIdeas,
				votes: sql<number>`(
					select count(*)::int from idea_votes v where v.idea_id = ${projectIdeas.id}
				)`,
			})
			.from(projectIdeas);

		const rows = status
			? await base
					.where(eq(projectIdeas.status, status))
					.orderBy(desc(projectIdeas.createdAt))
			: await base.orderBy(desc(projectIdeas.createdAt));

		return rows.map(({ idea, votes }) => ({ ...idea, votes }));
	}, []);
}

export async function getIdeaCounts() {
	return safe(async () => {
		const rows = await db!
			.select({ status: projectIdeas.status, n: sql<number>`count(*)::int` })
			.from(projectIdeas)
			.groupBy(projectIdeas.status);
		return Object.fromEntries(rows.map((r) => [r.status, r.n]));
	}, {} as Record<string, number>);
}

function toView(
	idea: typeof projectIdeas.$inferSelect,
	votes: number,
	voted: boolean
): IdeaView {
	return {
		id: idea.id,
		slug: idea.slug,
		title: idea.title,
		problem: idea.problem,
		proposal: idea.proposal,
		audience: idea.audience,
		stack: idea.stack ?? [],
		scope: idea.scope,
		proposerName: idea.proposerName,
		proposerGithub: idea.proposerGithub,
		status: idea.status,
		reviewNote: idea.reviewNote,
		projectUrl: idea.projectUrl,
		art: idea.art,
		createdAt: idea.createdAt.toISOString(),
		votes: Number(votes ?? 0),
		voted: Boolean(voted),
	};
}
