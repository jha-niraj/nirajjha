import { SiteShell } from "@/components/site-shell";
import { getBlogPosts } from "@/data/blog";

/**
 * Everything public. /admin sits outside this group so it gets none of the
 * site chrome.
 */
export default async function SiteLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const posts = await getBlogPosts();
	// Titles only. The assistant needs to name the post it is scoped to, and
	// this is a handful of strings rather than a round trip on every navigation.
	const postTitles = Object.fromEntries(
		posts.map((p) => [p.slug, p.metadata.title])
	);

	return <SiteShell postTitles={postTitles}>{children}</SiteShell>;
}
