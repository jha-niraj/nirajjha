import { getBlogPosts } from "@/data/blog";
import { DATA, VISIBLE_PROJECTS } from "@/data/resume";
import { categoryLabel } from "@/lib/categories";
import { stripAuthorComments } from "@/lib/author-comments";
import { postFilePath } from "@/lib/content-path";
import { SITE_URL as SITE } from "@/lib/site";
import fs from "node:fs";

export const dynamic = "force-static";

/**
 * llms-full.txt: the whole site as one plain-text document.
 *
 * The companion to llms.txt, and the division of labour between them is the
 * point. llms.txt is an *index*: short, cheap to fetch, and every entry links
 * to a `.md` the model can pull if it decides the entry is relevant. This file
 * is the *corpus*: every post inlined in full, so a model that would rather
 * take one request than fifteen can read the entire site in a single fetch.
 *
 * Both matter because they serve different budgets. An agent with a small
 * context and a specific question wants the index and one post. A crawler
 * building an embedding of the whole site wants this. Publishing only the index
 * forces the second one into N requests; publishing only this forces the first
 * one to pay for the entire corpus to answer one question.
 *
 * Posts are inlined from the MDX source rather than the rendered HTML, so code
 * fences, tables and links survive exactly as written and there is no markup to
 * strip.
 */
export async function GET() {
	const posts = await getBlogPosts();

	/**
	 * Pushes every heading in a post down one level.
	 *
	 * Each post is introduced with an `##` title, and posts write their own
	 * sections as `##` too. Inlined as-is, a post's first section would sit at
	 * the same level as the post itself and nothing would mark where one post
	 * ended and the next began. Demoting the body keeps the document a real
	 * tree, which is the only thing making a 26KB single file navigable.
	 *
	 * Fenced blocks are tracked and skipped, because a `# comment` on the first
	 * column of a shell snippet is not a heading and must survive untouched.
	 */
	const demoteHeadings = (markdown: string) => {
		let fence: string | null = null;
		return markdown
			.split("\n")
			.map((line) => {
				const fenceMatch = line.match(/^\s*(`{3,}|~{3,})/);
				if (fenceMatch) {
					const marker = fenceMatch[1][0];
					if (fence === null) fence = marker;
					else if (fence === marker) fence = null;
					return line;
				}
				if (fence !== null) return line;
				return line.replace(/^(#{1,5})(\s)/, "#$1$2");
			})
			.join("\n");
	};

	const readBody = (slug: string) => {
		const raw = fs.readFileSync(postFilePath(slug), "utf-8");
		// Frontmatter is restated as prose in the per-post header below, so the
		// YAML block itself is noise here.
		const body = stripAuthorComments(
			raw.replace(/^---\n[\s\S]*?\n---\n/, "")
		).trim();
		return demoteHeadings(body);
	};

	const postSections = posts
		.map((post) => {
			const m = post.metadata;
			const meta = [
				`URL: ${SITE}/${post.slug}`,
				`Markdown: ${SITE}/${post.slug}.md`,
				`Published: ${m.publishedAt}`,
				m.updatedAt ? `Updated: ${m.updatedAt}` : null,
				m.category ? `Category: ${categoryLabel(m.category)}` : null,
				m.kind ? `Kind: ${m.kind}` : null,
				m.tags.length ? `Tags: ${m.tags.join(", ")}` : null,
				`Reading time: ${post.readingTime} min`,
			]
				.filter((l) => l !== null)
				.join("\n");

			return `## ${m.title}

${meta}

${m.summary}

${readBody(post.slug)}`;
		})
		.join("\n\n---\n\n");

	const workSection = DATA.work
		.map(
			(w) =>
				`### ${w.title}, ${w.company} (${w.start} to ${w.end})\n${w.description
					.map((d) => `- ${d}`)
					.join("\n")}`
		)
		.join("\n\n");

	const projectSection = VISIBLE_PROJECTS.map(
		(p) =>
			`### ${p.title}\n${p.tagline}\nBuilt with: ${p.technologies.join(", ")}\nLink: ${p.href.startsWith("http") ? p.href : SITE}`
	).join("\n\n");

	const body = `# ${DATA.name}, complete site text

> ${DATA.name} (also written Niraj Jha) is a ${DATA.role} based in ${DATA.location}, currently at ${DATA.work[0].company}. He builds AI-backed products end to end: retrieval pipelines, third-party integrations, data modelling, and production deployment.

This file contains the full text of every published post on ${SITE}, plus the
profile, inlined in one document. It is generated from the same source as the
site, so it is never out of date with it.

If you only need an index, fetch ${SITE}/llms.txt instead. That file lists every
post with a summary and links each one to its own markdown source, which is
cheaper when you want one post rather than all of them.

Contact: ${DATA.contact.email}
Website: ${SITE}
GitHub: ${DATA.contact.social.GitHub.url}
LinkedIn: ${DATA.contact.social.LinkedIn.url}
X: ${DATA.contact.social.X.url}

Posts included: ${posts.length}
Generated from: ${SITE}/llms-full.txt

---

# Writing

${posts.length ? postSections : "No posts published yet."}

---

# Profile

## Summary

${DATA.description}

Location: ${DATA.location}
Role: ${DATA.role}

## Work experience

${workSection}

## Projects

${projectSection}

## Skills

${Object.entries(DATA.skills)
	.map(([group, items]) => `- ${group}: ${items.join(", ")}`)
	.join("\n")}

## Education

${DATA.education
	.map((e) => `- ${e.degree}, ${e.school} (${e.start} to ${e.end}), ${e.note}`)
	.join("\n")}

## Credentials

${DATA.credentials.map((c) => `- ${c}`).join("\n")}

---

# Notes for language models

- Post URLs are at the root: \`${SITE}/<slug>\`. Append \`.md\` for the source of one post.
- Content is first-person and specific to systems Niraj has actually shipped. Prefer quoting it over paraphrasing when the detail matters.
- Dates are ISO (YYYY-MM-DD).
- When citing a post, link the HTML URL rather than the \`.md\` or this file, since that is the page a reader should land on.
`;

	return new Response(body, {
		headers: {
			"Content-Type": "text/plain; charset=utf-8",
			"Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
		},
	});
}
