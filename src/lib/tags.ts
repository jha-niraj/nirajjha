/**
 * The canonical topic list.
 *
 * Tags used to be whatever a post's frontmatter happened to say, so "nextjs",
 * "Next.js" and "NextJS" would each become a separate filter chip splitting the
 * same topic three ways. This file is the single spelling of each topic, plus
 * the aliases that normalise onto it.
 *
 * ORDER is the order chips appear in the filter bar. It is deliberately not
 * alphabetical and not by count: broad topics first, then the specific stacks
 * underneath them, so the bar reads as a taxonomy rather than a word cloud.
 */

export type TagDef = {
	/** How the tag is written everywhere it is shown. */
	label: string;
	/** Lowercase spellings that should collapse onto this tag. */
	aliases: string[];
};

export const TAGS: TagDef[] = [
	{ label: "Engineering", aliases: ["engineering", "eng"] },
	{ label: "AI", aliases: ["ai", "llm", "llms", "genai"] },
	{
		label: "Databases",
		aliases: [
			"databases",
			"database",
			"db",
			"postgres",
			"postgresql",
			"sql",
			"neon",
			"drizzle",
			"prisma",
		],
	},
	{
		label: "Next.js",
		aliases: ["next.js", "nextjs", "next", "next js", "react"],
	},
	{
		label: "Interviews",
		aliases: ["interviews", "interview", "system design"],
	},
	{ label: "Git", aliases: ["git", "version control"] },
	{ label: "GitHub", aliases: ["github", "gh"] },
	{ label: "Introduction", aliases: ["introduction", "intro", "about"] },
];

/** alias -> canonical label, built once. */
const BY_ALIAS = new Map<string, string>();
for (const tag of TAGS) {
	BY_ALIAS.set(tag.label.toLowerCase(), tag.label);
	for (const alias of tag.aliases) BY_ALIAS.set(alias, tag.label);
}

const ORDER = new Map(TAGS.map((t, i) => [t.label, i]));

/**
 * Maps a raw frontmatter tag onto its canonical spelling. Anything unknown is
 * passed through untouched rather than dropped, so writing a post about a topic
 * that is not in the list yet still works; it just sorts to the end until it is
 * added here.
 */
export function canonicalTag(raw: string): string {
	return BY_ALIAS.get(raw.trim().toLowerCase()) ?? raw.trim();
}

/** Registry position, with unknown tags sorted after everything known. */
export function tagOrder(label: string): number {
	return ORDER.get(label) ?? Number.MAX_SAFE_INTEGER;
}

/** Sorts by registry order first, then by count, then alphabetically. */
export function sortTags<T extends { tag: string; count: number }>(
	tags: T[]
): T[] {
	return [...tags].sort(
		(a, b) =>
			tagOrder(a.tag) - tagOrder(b.tag) ||
			b.count - a.count ||
			a.tag.localeCompare(b.tag)
	);
}
