import type { PostSummary } from "@/lib/post-types";

/**
 * Field-weighted, token-aware search over posts.
 *
 * The point of the weighting is to separate near-miss terms that a naive
 * `includes()` filter treats identically. Searching "git" ranks a post tagged
 * `Git` above one that only mentions GitHub, because a whole-word hit scores an
 * order of magnitude higher than the prefix hit inside "github". Both still
 * appear, so nothing is hidden; they are just in the right order.
 */

const FIELD_WEIGHTS = {
	tag: 1.0,
	title: 0.9,
	outline: 0.5,
	summary: 0.4,
} as const;

type Field = keyof typeof FIELD_WEIGHTS;

const MATCH_SCORES = {
	/** Whole word: "git" in "Git", "using git daily". */
	exact: 100,
	/** Word starts with the term: "git" in "github", "gitlab". */
	prefix: 25,
	/** Term appears mid-word: "git" in "digit". Weakest signal by far. */
	infix: 4,
} as const;

const WORD = /[\p{L}\p{N}+#.]+/gu;

function tokenize(text: string): string[] {
	return (text.toLowerCase().match(WORD) ?? []).filter(Boolean);
}

/** Highest-value match of one term against one field's words. */
function scoreTerm(term: string, words: string[]): number {
	let best = 0;
	for (const word of words) {
		if (word === term) return MATCH_SCORES.exact;
		if (word.startsWith(term)) best = Math.max(best, MATCH_SCORES.prefix);
		else if (word.includes(term)) best = Math.max(best, MATCH_SCORES.infix);
	}
	return best;
}

export type SearchHit = {
	post: PostSummary;
	score: number;
	/** Which field produced the strongest hit, shown as a "matched in" hint. */
	matchedIn: Field | null;
};

export function searchPosts(
	posts: PostSummary[],
	query: string,
	activeTags: string[]
): SearchHit[] {
	const tagged = activeTags.length
		? posts.filter((p) =>
				// AND across selected tags: picking Git + AI means both.
				activeTags.every((t) =>
					p.tags.some((pt) => pt.toLowerCase() === t.toLowerCase())
				)
			)
		: posts;

	const terms = tokenize(query);
	if (terms.length === 0) {
		return tagged.map((post) => ({ post, score: 0, matchedIn: null }));
	}

	const hits: SearchHit[] = [];

	for (const post of tagged) {
		const fields: Record<Field, string[]> = {
			tag: tokenize(post.tags.join(" ")),
			title: tokenize(post.title),
			outline: tokenize(post.outline.join(" ")),
			summary: tokenize(post.summary),
		};

		let total = 0;
		let bestField: Field | null = null;
		let bestFieldScore = 0;
		let everyTermMatched = true;

		for (const term of terms) {
			let termBest = 0;
			let termField: Field | null = null;

			for (const field of Object.keys(fields) as Field[]) {
				const raw = scoreTerm(term, fields[field]);
				if (raw === 0) continue;
				const weighted = raw * FIELD_WEIGHTS[field];
				if (weighted > termBest) {
					termBest = weighted;
					termField = field;
				}
			}

			// AND semantics: a post has to satisfy every term the reader typed.
			if (termBest === 0) {
				everyTermMatched = false;
				break;
			}

			total += termBest;
			if (termBest > bestFieldScore) {
				bestFieldScore = termBest;
				bestField = termField;
			}
		}

		if (everyTermMatched) {
			hits.push({ post, score: total, matchedIn: bestField });
		}
	}

	return hits.sort(
		(a, b) =>
			b.score - a.score ||
			b.post.publishedAt.localeCompare(a.post.publishedAt)
	);
}

/**
 * Splits text into matched / unmatched runs for highlighting. Matches on word
 * starts only, so highlighting "git" marks the "git" in "github" but not the
 * one inside "digit", which is the same rule the scorer treats as meaningful.
 */
export function highlight(
	text: string,
	query: string
): { text: string; match: boolean }[] {
	const terms = tokenize(query);
	if (!terms.length) return [{ text, match: false }];

	const escaped = terms
		.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
		.sort((a, b) => b.length - a.length)
		.join("|");

	const re = new RegExp(`(?<![\\p{L}\\p{N}])(${escaped})`, "giu");
	const out: { text: string; match: boolean }[] = [];
	let last = 0;

	for (const m of text.matchAll(re)) {
		const start = m.index ?? 0;
		if (start > last) out.push({ text: text.slice(last, start), match: false });
		out.push({ text: m[0], match: true });
		last = start + m[0].length;
	}
	if (last < text.length) out.push({ text: text.slice(last), match: false });

	return out;
}
