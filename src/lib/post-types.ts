/**
 * The client-safe shape of a post.
 *
 * The server-side `Post` carries the rendered HTML, which is far too big to
 * ship to a filter component. Everything that crosses into a client component
 * goes through this type instead.
 */
export type PostSummary = {
	slug: string;
	title: string;
	summary: string;
	publishedAt: string;
	readingTime: number;
	tags: string[];
	/** Slug form, e.g. `databases`. Run through `categoryLabel` to display. */
	category?: string;
	art?: string;
	featured: boolean;
	/** Heading text, so search can match on what a post actually covers. */
	outline: string[];
	views: number;
	comments: number;
};
