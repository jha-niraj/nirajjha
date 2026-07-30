import { getBlogPosts } from "@/data/blog";
import { postFilePath } from "@/lib/content-path";
import { SITE_URL } from "@/lib/site";
import fs from "node:fs";

export const dynamic = "force-static";

/**
 * The plain-markdown version of a post, served at `/<slug>.md` via a rewrite.
 *
 * This is the half of the llms.txt convention that actually matters, and the
 * reason Stripe's is useful: llms.txt is only an index, and an index of HTML
 * pages still leaves a model to parse a React app to read one. Every link in
 * ours points at a `.md`, so a crawler can fetch the source of any post in one
 * request with no markup to strip.
 *
 * It serves the raw MDX body, not the rendered HTML, so code fences, tables and
 * links survive exactly as written.
 */
export async function generateStaticParams() {
	const posts = await getBlogPosts();
	return posts.map((post) => ({ slug: post.slug }));
}

export async function GET(
	_request: Request,
	{ params }: { params: Promise<{ slug: string }> }
) {
	const { slug } = await params;

	// Checked against the published set rather than trusting the path, so this
	// cannot be used to read arbitrary files out of the content directory.
	const posts = await getBlogPosts();
	const post = posts.find((p) => p.slug === slug);
	if (!post) {
		return new Response("Not found", { status: 404 });
	}

	const file = postFilePath(slug);
	const raw = fs.readFileSync(file, "utf-8");
	// Drop the frontmatter block and restate the useful parts as prose, so a
	// reader of the plain file gets the metadata without YAML noise.
	const body = raw.replace(/^---\n[\s\S]*?\n---\n/, "").trim();

	const { title, summary, publishedAt, category, tags } = post.metadata;

	const header = [
		`# ${title}`,
		"",
		summary,
		"",
		`Published: ${publishedAt}`,
		category ? `Category: ${category}` : null,
		tags.length ? `Tags: ${tags.join(", ")}` : null,
		`Source: ${SITE_URL}/${slug}`,
		"",
		"---",
		"",
	]
		.filter((line) => line !== null)
		.join("\n");

	return new Response(`${header}${body}\n`, {
		headers: {
			"Content-Type": "text/markdown; charset=utf-8",
			"Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
		},
	});
}
