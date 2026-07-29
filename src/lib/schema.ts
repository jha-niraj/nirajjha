import { DATA, VISIBLE_PROJECTS } from "@/data/resume";
import { SITE_URL as SITE } from "@/lib/site";

/**
 * Stable @id anchors. Every node that references another (author, publisher,
 * mainEntity) points at one of these, and the referenced node must also be
 * present in the SAME page's @graph - a crawler treats each URL as an
 * independent entry point and will not inherit nodes from the homepage.
 */
const PERSON_ID = `${SITE}/#person`;
const WEBSITE_ID = `${SITE}/#website`;
const PROFILE_ID = `${SITE}/#profile`;
const BLOG_ID = `${SITE}/blogs#blog`;

const SAME_AS = Object.values(DATA.contact.social)
	.filter((s) => s.navbar)
	.map((s) => s.url);

export function buildPerson() {
	return {
		"@type": "Person",
		"@id": PERSON_ID,
		name: DATA.name,
		alternateName: [DATA.shortName, "nirajjha", "jha-niraj"],
		url: SITE,
		image: `${SITE}${DATA.avatarUrl}`,
		jobTitle: DATA.role,
		email: `mailto:${DATA.contact.email}`,
		description: DATA.description,
		nationality: { "@type": "Country", name: "India" },
		address: {
			"@type": "PostalAddress",
			addressRegion: "Punjab",
			addressCountry: "IN",
		},
		worksFor: {
			"@type": "Organization",
			name: DATA.work[0].company,
			url: DATA.work[0].href,
		},
		alumniOf: DATA.education.map((e) => ({
			"@type": "EducationalOrganization",
			name: e.school,
			...(e.href !== "#" ? { url: e.href } : {}),
		})),
		knowsAbout: [
			...new Set(Object.values(DATA.skills).flatMap((group) => [...group])),
		],
		knowsLanguage: ["English", "Hindi", "Nepali"],
		sameAs: SAME_AS,
	};
}

export function buildWebSite() {
	return {
		"@type": "WebSite",
		"@id": WEBSITE_ID,
		url: SITE,
		name: `${DATA.shortName} - ${DATA.role}`,
		description: DATA.description,
		publisher: { "@id": PERSON_ID },
		inLanguage: "en",
	};
}

export type BreadcrumbItem = { name: string; url: string };

export function buildBreadcrumbList(items: readonly BreadcrumbItem[]) {
	return {
		"@type": "BreadcrumbList",
		itemListElement: items.map((item, i) => ({
			"@type": "ListItem",
			position: i + 1,
			name: item.name,
			item: item.url,
		})),
	};
}

/**
 * The homepage is a personal profile, so ProfilePage (not WebPage) is the
 * correct type - it is what Google reads to attribute the whole page to a
 * single Person entity. The work history rides along as an ItemList so the
 * roles are machine-readable without inventing separate pages for them.
 */
export function buildProfileGraph() {
	return {
		"@context": "https://schema.org",
		"@graph": [
			buildPerson(),
			buildWebSite(),
			{
				"@type": "ProfilePage",
				"@id": PROFILE_ID,
				url: SITE,
				name: `${DATA.name} - ${DATA.role}`,
				description: DATA.description,
				isPartOf: { "@id": WEBSITE_ID },
				mainEntity: { "@id": PERSON_ID },
				inLanguage: "en",
				about: { "@id": PERSON_ID },
			},
			{
				"@type": "ItemList",
				"@id": `${SITE}/#experience`,
				name: `Work experience - ${DATA.name}`,
				numberOfItems: DATA.work.length,
				itemListOrder: "https://schema.org/ItemListOrderDescending",
				itemListElement: DATA.work.map((w, i) => ({
					"@type": "ListItem",
					position: i + 1,
					item: {
						"@type": "OrganizationRole",
						roleName: w.title,
						startDate: w.start,
						...(w.end !== "Present" ? { endDate: w.end } : {}),
						namedPosition: w.title,
						memberOf: {
							"@type": "Organization",
							name: w.company,
							...(w.href !== "#" ? { url: w.href } : {}),
						},
					},
				})),
			},
			{
				"@type": "ItemList",
				"@id": `${SITE}/#projects`,
				name: `Projects - ${DATA.name}`,
				numberOfItems: VISIBLE_PROJECTS.length,
				itemListElement: VISIBLE_PROJECTS.map((p, i) => ({
					"@type": "ListItem",
					position: i + 1,
					item: {
						"@type": "SoftwareApplication",
						name: p.title,
						applicationCategory: "WebApplication",
						operatingSystem: "Web",
						description: p.description,
						...(p.href.startsWith("http") ? { url: p.href } : {}),
						author: { "@id": PERSON_ID },
					},
				})),
			},
			buildBreadcrumbList([{ name: "Home", url: SITE }]),
		],
	};
}

export type PostForSchema = {
	slug: string;
	title: string;
	summary: string;
	publishedAt: string;
	updatedAt?: string;
	image?: string;
	tags?: readonly string[];
	readingTime?: number;
};

export function buildBlogIndexGraph(posts: readonly PostForSchema[]) {
	const url = `${SITE}/blogs`;
	return {
		"@context": "https://schema.org",
		"@graph": [
			{
				"@type": "Blog",
				"@id": BLOG_ID,
				url,
				name: `Blog, ${DATA.shortName}`,
				description:
					"Writing on shipping AI products, full-stack engineering, and the decisions that hold up after launch.",
				publisher: { "@id": PERSON_ID },
				author: { "@id": PERSON_ID },
				inLanguage: "en",
				blogPost: posts.map((p) => ({
					"@type": "BlogPosting",
					"@id": `${SITE}/${p.slug}#article`,
					url: `${SITE}/${p.slug}`,
					headline: p.title,
					description: p.summary,
					datePublished: p.publishedAt,
					dateModified: p.updatedAt ?? p.publishedAt,
					author: { "@id": PERSON_ID },
				})),
			},
			buildPerson(),
			{
				"@type": "ItemList",
				"@id": `${url}#list`,
				name: `Blog, ${DATA.shortName}`,
				numberOfItems: posts.length,
				itemListOrder: "https://schema.org/ItemListOrderDescending",
				itemListElement: posts.map((p, i) => ({
					"@type": "ListItem",
					position: i + 1,
					url: `${SITE}/${p.slug}`,
					name: p.title,
				})),
			},
			buildBreadcrumbList([
				{ name: "Home", url: SITE },
				{ name: "Blog", url },
			]),
		],
	};
}

export function buildPostGraph(post: PostForSchema) {
	const url = `${SITE}/${post.slug}`;
	const image = post.image
		? `${SITE}${post.image}`
		: `${url}/opengraph-image`;

	return {
		"@context": "https://schema.org",
		"@graph": [
			{
				"@type": "BlogPosting",
				"@id": `${url}#article`,
				headline: post.title,
				description: post.summary,
				image,
				datePublished: post.publishedAt,
				dateModified: post.updatedAt ?? post.publishedAt,
				author: { "@id": PERSON_ID },
				publisher: { "@id": PERSON_ID },
				mainEntityOfPage: { "@type": "WebPage", "@id": url },
				isPartOf: { "@id": BLOG_ID },
				url,
				inLanguage: "en",
				...(post.tags?.length ? { keywords: [...post.tags] } : {}),
				...(post.readingTime
					? {
							timeRequired: `PT${Math.max(1, Math.round(post.readingTime))}M`,
						}
					: {}),
			},
			// The article references author + publisher by @id; the Person node has
			// to resolve inside this page's graph or the rich result is rejected.
			buildPerson(),
			buildBreadcrumbList([
				{ name: "Home", url: SITE },
				{ name: "Blog", url: `${SITE}/blogs` },
				{ name: post.title, url },
			]),
		],
	};
}

/** Renders a graph as the JSON-LD script tag Next.js expects. */
export function jsonLd(graph: unknown) {
	return {
		type: "application/ld+json",
		dangerouslySetInnerHTML: { __html: JSON.stringify(graph) },
	};
}
