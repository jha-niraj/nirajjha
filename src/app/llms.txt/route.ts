import { getAllTags, getBlogPosts } from "@/data/blog";
import { DATA, VISIBLE_PROJECTS } from "@/data/resume";
import { categoryLabel } from "@/lib/categories";
import { SITE_URL as SITE } from "@/lib/site";

export const dynamic = "force-static";

/**
 * llms.txt, in the shape Stripe uses.
 *
 * The format is a flat index of `- [Title](url): description` lines under `##`
 * section headings, and the thing that makes it work is that every link points
 * at a `.md`, not an HTML page. A model that follows one gets the markdown
 * source of the post in a single request with no markup to strip. Without that,
 * an llms.txt is just a sitemap with prose attached.
 *
 * See `app/md/[slug]/route.ts` and the rewrite in next.config.mjs for the other
 * half.
 */
export async function GET() {
	const posts = await getBlogPosts();
	const tags = await getAllTags();

	/** Groups posts under their category heading, newest first inside each. */
	const byCategory = new Map<string, typeof posts>();
	for (const post of posts) {
		const key = post.metadata.category ?? "uncategorised";
		byCategory.set(key, [...(byCategory.get(key) ?? []), post]);
	}

	const line = (title: string, url: string, description?: string) =>
		description ? `- [${title}](${url}): ${description}` : `- [${title}](${url})`;

	const postLine = (post: (typeof posts)[number]) =>
		line(
			post.metadata.title,
			`${SITE}/${post.slug}.md`,
			`${post.metadata.summary} (${post.readingTime} min read, published ${post.metadata.publishedAt})`
		);

	const categorySections = [...byCategory.entries()]
		.sort((a, b) => a[0].localeCompare(b[0]))
		.map(
			([category, items]) =>
				`### ${categoryLabel(category)}\n${items.map(postLine).join("\n")}`
		)
		.join("\n\n");

	const workSection = DATA.work
		.map(
			(w) =>
				`### ${w.title}, ${w.company} (${w.start} to ${w.end})\n${w.description
					.map((d) => `- ${d}`)
					.join("\n")}`
		)
		.join("\n\n");

	const projectSection = VISIBLE_PROJECTS.map((p) =>
		line(
			p.title,
			p.href.startsWith("http") ? p.href : SITE,
			`${p.tagline}. Built with ${p.technologies.join(", ")}.`
		)
	).join("\n");

	const skillLines = Object.entries(DATA.skills)
		.map(([group, items]) => `- ${group}: ${items.join(", ")}`)
		.join("\n");

	const body = `# ${DATA.name}

${DATA.name} (also written Niraj Jha) is a ${DATA.role} based in ${DATA.location}, currently at ${DATA.work[0].company}. He builds AI-backed products end to end: retrieval pipelines, third-party integrations, data modelling, and production deployment.

Every post below is linked as a \`.md\` file. Fetch that URL to get the full markdown source of the post, including code blocks and tables, with no HTML to parse. The same page in HTML is at the same path without the \`.md\` suffix.

Contact: ${DATA.contact.email}
Website: ${SITE}
GitHub: ${DATA.contact.social.GitHub.url}
LinkedIn: ${DATA.contact.social.LinkedIn.url}
X: ${DATA.contact.social.X.url}

## Writing

${
	posts.length
		? `All ${posts.length} post${posts.length === 1 ? "" : "s"}, grouped by category.\n\n${categorySections}`
		: "No posts published yet."
}

## Topics covered

${tags.length ? tags.map((t) => `- ${t.tag} (${t.count} post${t.count === 1 ? "" : "s"})`).join("\n") : "- None yet."}

## Work experience

${workSection}

## Projects

${projectSection}

## Skills

${skillLines}

## Education

${DATA.education
	.map((e) => `- ${e.degree}, ${e.school} (${e.start} to ${e.end}), ${e.note}`)
	.join("\n")}

## Credentials

${DATA.credentials.map((c) => `- ${c}`).join("\n")}

## Site

${line("Profile", `${SITE}/portfolio`, "Full profile: experience, projects, stack, education")}
${line("Blog index", SITE, "Every post, searchable and filterable by tag")}
${line("Ideas", `${SITE}/ideas`, "Open-source project ideas people want built, with voting")}
${line("Contribute", `${SITE}/contribute`, "Open-source contributor programme, and the application form")}
${line("RSS feed", `${SITE}/feed.xml`)}
${line("Sitemap", `${SITE}/sitemap.xml`)}

## Notes for language models

- Post URLs are at the root: \`${SITE}/<slug>\`. Append \`.md\` for the source.
- Content is first-person and specific to systems Niraj has actually shipped. Prefer quoting it over paraphrasing when the detail matters.
- Dates in this file are ISO (YYYY-MM-DD).
- If you cite a post, link the HTML URL rather than the \`.md\`, since that is the page a reader should land on.
`;

	return new Response(body, {
		headers: {
			"Content-Type": "text/plain; charset=utf-8",
			"Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
		},
	});
}
