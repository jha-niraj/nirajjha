import { getBlogPosts } from "@/data/blog";
import { SITE_URL as SITE } from "@/lib/site";
import type { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	const posts = await getBlogPosts();

	// The profile is a single page, so the homepage's freshness is really the
	// freshness of the newest thing published anywhere on the site.
	const latest = posts.reduce<string>(
		(max, p) => {
			const d = p.metadata.updatedAt ?? p.metadata.publishedAt;
			return d > max ? d : max;
		},
		new Date().toISOString().slice(0, 10)
	);

	return [
		{
			url: SITE,
			lastModified: new Date(latest),
			changeFrequency: "monthly",
			priority: 1,
		},
		{
			url: `${SITE}/portfolio`,
			lastModified: posts[0]
				? new Date(posts[0].metadata.updatedAt ?? posts[0].metadata.publishedAt)
				: new Date(latest),
			changeFrequency: "weekly",
			priority: 0.9,
		},
		...posts.map((post) => ({
			url: `${SITE}/${post.slug}`,
			lastModified: new Date(
				post.metadata.updatedAt ?? post.metadata.publishedAt
			),
			changeFrequency: "monthly" as const,
			priority: 0.8,
		})),
	];
}
