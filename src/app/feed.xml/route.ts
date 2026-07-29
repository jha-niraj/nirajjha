import { getBlogPosts } from "@/data/blog";
import { DATA } from "@/data/resume";
import { SITE_URL as SITE } from "@/lib/site";

export const dynamic = "force-static";

function escape(s: string): string {
	return s
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&apos;");
}

export async function GET() {
	const posts = await getBlogPosts();
	const updated = posts[0]
		? new Date(
				posts[0].metadata.updatedAt ?? posts[0].metadata.publishedAt
			).toUTCString()
		: new Date(0).toUTCString();

	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>${escape(`${DATA.shortName}, Blog`)}</title>
    <link>${SITE}/blogs</link>
    <description>Writing on shipping AI products, full-stack engineering, and the decisions that hold up after launch.</description>
    <language>en</language>
    <lastBuildDate>${updated}</lastBuildDate>
    <managingEditor>${DATA.contact.email} (${DATA.name})</managingEditor>
    <atom:link href="${SITE}/feed.xml" rel="self" type="application/rss+xml" />
${posts
	.map(
		(post) => `    <item>
      <title>${escape(post.metadata.title)}</title>
      <link>${SITE}/${post.slug}</link>
      <guid isPermaLink="true">${SITE}/${post.slug}</guid>
      <description>${escape(post.metadata.summary)}</description>
      <pubDate>${new Date(post.metadata.publishedAt).toUTCString()}</pubDate>
${post.metadata.tags
	.map((tag) => `      <category>${escape(tag)}</category>`)
	.join("\n")}
    </item>`
	)
	.join("\n")}
  </channel>
</rss>`;

	return new Response(xml, {
		headers: {
			"Content-Type": "application/rss+xml; charset=utf-8",
			"Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
		},
	});
}
