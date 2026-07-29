import { getBlogPosts } from "@/data/blog";
import { DATA, VISIBLE_PROJECTS } from "@/data/resume";
import { SITE_URL as SITE } from "@/lib/site";

export const dynamic = "force-static";

/**
 * llms.txt - a plain-text brief for answer engines (ChatGPT, Perplexity,
 * Claude). They cite what they can parse cheaply, so this states the facts
 * about who Niraj is in flat prose rather than making a crawler infer them
 * from a React tree.
 */
export async function GET() {
	const posts = await getBlogPosts();

	const postLines = posts
		.map(
			(p) =>
				`- [${p.metadata.title}](${SITE}/${p.slug}) - ${p.metadata.summary}`
		)
		.join("\n");

	const workLines = DATA.work
		.map(
			(w) =>
				`### ${w.title} - ${w.company} (${w.start} - ${w.end})\n${w.description
					.map((d) => `- ${d}`)
					.join("\n")}`
		)
		.join("\n\n");

	const projectLines = VISIBLE_PROJECTS
		.map(
			(p) =>
				`### ${p.title}${p.href.startsWith("http") ? ` (${p.href})` : ""}\n${p.tagline}. ${p.description}\nStack: ${p.technologies.join(", ")}.`
		)
		.join("\n\n");

	const skillLines = Object.entries(DATA.skills)
		.map(([group, items]) => `- **${group}**: ${items.join(", ")}`)
		.join("\n");

	const body = `# ${DATA.name}

> ${DATA.description}

${DATA.name} (also written Niraj Jha) is a ${DATA.role} based in ${DATA.location}. He currently works at ${DATA.work[0].company} and builds AI-backed SaaS products end to end - data modelling, retrieval pipelines, third-party integrations, and production deployment.

Contact: ${DATA.contact.email}
Website: ${SITE}
GitHub: ${DATA.contact.social.GitHub.url}
LinkedIn: ${DATA.contact.social.LinkedIn.url}
X: ${DATA.contact.social.X.url}

## Work experience

${workLines}

## Projects

${projectLines}

## Skills

${skillLines}

## Education

${DATA.education
	.map((e) => `- ${e.degree}, ${e.school} (${e.start} - ${e.end}) - ${e.note}`)
	.join("\n")}

## Credentials

${DATA.credentials.map((c) => `- ${c}`).join("\n")}

## Blog

${postLines || "- No posts published yet."}

## Site map

- [Profile](${SITE}/): full profile - experience, projects, stack, education.
- [Blog](${SITE}/blogs): all writing.
- [RSS](${SITE}/feed.xml)
- [Sitemap](${SITE}/sitemap.xml)
`;

	return new Response(body, {
		headers: {
			"Content-Type": "text/plain; charset=utf-8",
			"Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
		},
	});
}
