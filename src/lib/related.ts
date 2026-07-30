import type { Post } from "@/data/blog";

/**
 * Ranks what to read next.
 *
 * Recency alone is the wrong signal on a blog that covers more than one thing:
 * somebody who has just finished a Postgres post is far more likely to want the
 * other database post from a year ago than today's piece about hiring.
 *
 * Category is weighted well above tags because a category is a deliberate,
 * one-per-post decision, while tags are a loose bag that overlap by accident.
 * Recency stays in as a small tiebreaker so that among equally related posts,
 * the fresher one wins.
 */

const WEIGHTS = {
	sameCategory: 100,
	sharedTag: 22,
	sameKind: 8,
	/** Applied to a 0..1 recency score, so it can only break near-ties. */
	recency: 10,
};

export function rankRelated(current: Post, all: Post[], limit = 3): Post[] {
	const candidates = all.filter((p) => p.slug !== current.slug);
	if (candidates.length === 0) return [];

	const currentTags = new Set(current.metadata.tags.map((t) => t.toLowerCase()));

	const times = candidates.map((p) =>
		new Date(p.metadata.publishedAt).getTime()
	);
	const newest = Math.max(...times);
	const oldest = Math.min(...times);
	const span = newest - oldest || 1;

	return candidates
		.map((post) => {
			let score = 0;

			if (
				current.metadata.category &&
				post.metadata.category === current.metadata.category
			) {
				score += WEIGHTS.sameCategory;
			}

			for (const tag of post.metadata.tags) {
				if (currentTags.has(tag.toLowerCase())) score += WEIGHTS.sharedTag;
			}

			if (current.metadata.kind && post.metadata.kind === current.metadata.kind) {
				score += WEIGHTS.sameKind;
			}

			const age = new Date(post.metadata.publishedAt).getTime();
			score += ((age - oldest) / span) * WEIGHTS.recency;

			return { post, score };
		})
		.sort(
			(a, b) =>
				b.score - a.score ||
				b.post.metadata.publishedAt.localeCompare(a.post.metadata.publishedAt)
		)
		.slice(0, limit)
		.map((r) => r.post);
}
