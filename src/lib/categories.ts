/**
 * Post categories: stored lowercase, displayed in title case.
 *
 * Frontmatter and the `posts.category` column both hold the slug form
 * (`databases`), so grouping and filtering never depend on how a particular
 * post happened to capitalise the word. The label is a presentation concern
 * and lives here, next to the same idea in `tags.ts`.
 *
 * Anything not in the registry falls back to capitalising the first letter,
 * so a new category works before it is registered; it just does not get a
 * custom spelling until it is.
 */

const LABELS: Record<string, string> = {
	databases: "Databases",
	engineering: "Engineering",
	ai: "AI",
	frontend: "Frontend",
	infrastructure: "Infrastructure",
	// Registered ahead of the series so the first post lands as "Next.js" rather
	// than the fallback's "Nextjs".
	nextjs: "Next.js",
	git: "Git",
	performance: "Performance",
};

/** Frontmatter slug -> how the category is written on screen. */
export function categoryLabel(slug: string): string {
	const key = slug.trim().toLowerCase();
	return LABELS[key] ?? key.charAt(0).toUpperCase() + key.slice(1);
}

/** How a category is stored: lowercase, so `Databases` and `databases` agree. */
export function categorySlug(raw: string): string {
	return raw.trim().toLowerCase();
}
