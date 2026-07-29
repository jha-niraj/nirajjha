import "server-only";

import { CONTENT_DIR } from "@/lib/site";
import fs from "fs";
import GithubSlugger from "github-slugger";
import matter from "gray-matter";
import path from "path";
import { cache } from "react";
import readingTime from "reading-time";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeExternalLinks from "rehype-external-links";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeSlug from "rehype-slug";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";

export type PostMetadata = {
	title: string;
	publishedAt: string;
	/** Optional - falls back to publishedAt for dateModified / lastmod. */
	updatedAt?: string;
	summary: string;
	/** Path under /public. Omitted posts fall back to the generated OG image. */
	image?: string;
	/** Which animated SVG piece illustrates this post. See components/post-art. */
	art?: string;
	/** Broad grouping, e.g. "Engineering". Mirrored into the posts table. */
	category?: string;
	/** Shape of the piece: essay, tutorial, note. Mirrored into the posts table. */
	kind?: string;
	tags: string[];
	/** Drafts are excluded from the index, sitemap, RSS and static params. */
	draft: boolean;
	/** Pinned to the top of the blog index. */
	featured: boolean;
};

export type Post = {
	slug: string;
	metadata: PostMetadata;
	/** Rendered HTML. */
	source: string;
	/** Minutes, rounded up. */
	readingTime: number;
	/** h2/h3 headings, for the in-page table of contents. */
	headings: { id: string; text: string; level: 2 | 3 }[];
};

const contentDir = () => path.join(process.cwd(), CONTENT_DIR);

function getMDXFiles(dir: string) {
	if (!fs.existsSync(dir)) return [];
	return fs.readdirSync(dir).filter((file) => path.extname(file) === ".mdx");
}

/**
 * Normalises loose frontmatter into a fully-typed object so every consumer
 * (index, RSS, sitemap, JSON-LD) can rely on the same shape.
 */
function normalize(raw: Record<string, unknown>, slug: string): PostMetadata {
	const tags = Array.isArray(raw.tags)
		? raw.tags.map(String)
		: typeof raw.tags === "string"
			? raw.tags.split(",").map((t) => t.trim())
			: [];

	return {
		title: String(raw.title ?? slug),
		publishedAt: String(raw.publishedAt ?? "1970-01-01"),
		updatedAt: raw.updatedAt ? String(raw.updatedAt) : undefined,
		summary: String(raw.summary ?? ""),
		image: raw.image ? String(raw.image) : undefined,
		art: raw.art ? String(raw.art) : undefined,
		category: raw.category ? String(raw.category) : undefined,
		kind: raw.kind ? String(raw.kind) : undefined,
		tags,
		draft: raw.draft === true,
		featured: raw.featured === true,
	};
}

export async function markdownToHTML(markdown: string) {
	const file = await unified()
		.use(remarkParse)
		.use(remarkGfm)
		.use(remarkRehype)
		.use(rehypeSlug)
		.use(rehypeAutolinkHeadings, {
			behavior: "wrap",
			properties: { className: ["heading-anchor"] },
		})
		// Outbound links open in a new tab so a reader following a citation does
		// not lose their place. `noopener` is the security half of that (the
		// opened page cannot touch window.opener); `nofollow` is deliberately
		// NOT set, because these are genuine citations and passing a little
		// ranking to the things being cited is the honest behaviour.
		.use(rehypeExternalLinks, {
			target: "_blank",
			rel: ["noopener", "noreferrer"],
			protocols: ["http", "https"],
		})
		.use(rehypePrettyCode, {
			theme: { light: "github-light", dark: "github-dark-dimmed" },
			keepBackground: false,
			defaultLang: "plaintext",
		})
		.use(rehypeStringify)
		.process(markdown);

	return String(file);
}

/**
 * Pulls the heading outline out of the raw markdown. It walks *every* heading
 * level through a single GithubSlugger, the same slugger rehype-slug uses, so
 * duplicate-title counters line up with the ids on the rendered HTML, then
 * keeps only h2/h3 for the table of contents.
 */
function extractHeadings(markdown: string): Post["headings"] {
	const slugger = new GithubSlugger();
	const headings: Post["headings"] = [];
	let inFence = false;

	for (const line of markdown.split("\n")) {
		if (line.trimStart().startsWith("```")) {
			inFence = !inFence;
			continue;
		}
		if (inFence) continue;

		const match = /^(#{1,6})\s+(.+?)\s*#*\s*$/.exec(line);
		if (!match) continue;

		const level = match[1].length;
		const text = match[2].replace(/[*_`]/g, "").trim();
		const id = slugger.slug(text);

		if (level === 2 || level === 3) {
			headings.push({ level, text, id });
		}
	}

	return headings;
}

export const getPost = cache(async (slug: string): Promise<Post | null> => {
	const filePath = path.join(contentDir(), `${slug}.mdx`);
	if (!fs.existsSync(filePath)) return null;

	const raw = fs.readFileSync(filePath, "utf-8");
	const { content, data } = matter(raw);

	return {
		slug,
		metadata: normalize(data, slug),
		source: await markdownToHTML(content),
		readingTime: Math.max(1, Math.ceil(readingTime(content).minutes)),
		headings: extractHeadings(content),
	};
});

/**
 * Every published post, newest first. Drafts are filtered out in production
 * but kept in dev so you can preview them locally.
 */
export const getBlogPosts = cache(async (): Promise<Post[]> => {
	const files = getMDXFiles(contentDir());
	const posts = await Promise.all(
		files.map((file) => getPost(path.basename(file, path.extname(file))))
	);

	return posts
		.filter((p): p is Post => p !== null)
		.filter((p) => !p.metadata.draft || process.env.NODE_ENV === "development")
		.sort(
			(a, b) =>
				new Date(b.metadata.publishedAt).getTime() -
				new Date(a.metadata.publishedAt).getTime()
		);
});

/** All distinct tags across published posts, most-used first. */
export const getAllTags = cache(async () => {
	const posts = await getBlogPosts();
	const counts = new Map<string, number>();
	for (const post of posts) {
		for (const tag of post.metadata.tags) {
			counts.set(tag, (counts.get(tag) ?? 0) + 1);
		}
	}
	return [...counts.entries()]
		.sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
		.map(([tag, count]) => ({ tag, count }));
});
