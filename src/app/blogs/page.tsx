import BlurFade from "@/components/magicui/blur-fade";
import { BlogExplorer } from "@/components/blog-explorer";
import { getAllTags, getBlogPosts } from "@/data/blog";
import { DATA } from "@/data/resume";
import { getCommentCounts, getViewCounts } from "@/db/queries";
import type { PostSummary } from "@/lib/post-types";
import { buildBlogIndexGraph } from "@/lib/schema";
import { SubscribeButton } from "@/components/subscribe-form";
import { Rss } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

// Counters move without the content changing, so the page is regenerated on a
// short window rather than pinned at build time.
export const revalidate = 300;

const TITLE = "Blog";
const DESCRIPTION =
	"Writing on shipping AI products, full-stack engineering, and the design decisions that hold up after launch. By Niraj Jha.";

export const metadata: Metadata = {
	title: TITLE,
	description: DESCRIPTION,
	alternates: {
		canonical: "/blogs",
		types: {
			"application/rss+xml": [
				{ url: "/feed.xml", title: `${DATA.shortName}, Blog` },
			],
		},
	},
	openGraph: {
		type: "website",
		title: `${TITLE}, ${DATA.shortName}`,
		description: DESCRIPTION,
		url: "/blogs",
	},
	twitter: {
		card: "summary_large_image",
		title: `${TITLE}, ${DATA.shortName}`,
		description: DESCRIPTION,
	},
};

export default async function BlogPage() {
	const posts = await getBlogPosts();
	const tags = await getAllTags();
	const slugs = posts.map((p) => p.slug);

	const [views, commentCounts] = await Promise.all([
		getViewCounts(slugs),
		getCommentCounts(slugs),
	]);

	const summaries: PostSummary[] = posts.map((p) => ({
		slug: p.slug,
		title: p.metadata.title,
		summary: p.metadata.summary,
		publishedAt: p.metadata.publishedAt,
		readingTime: p.readingTime,
		tags: p.metadata.tags,
		category: p.metadata.category,
		art: p.metadata.art,
		featured: p.metadata.featured,
		outline: p.headings.map((h) => h.text),
		views: views[p.slug] ?? 0,
		comments: commentCounts[p.slug] ?? 0,
	}));

	return (
		<>
			<script
				type="application/ld+json"
				suppressHydrationWarning
				dangerouslySetInnerHTML={{
					__html: JSON.stringify(
						buildBlogIndexGraph(
							posts.map((p) => ({
								slug: p.slug,
								title: p.metadata.title,
								summary: p.metadata.summary,
								publishedAt: p.metadata.publishedAt,
								updatedAt: p.metadata.updatedAt,
								image: p.metadata.image,
								tags: p.metadata.tags,
								readingTime: p.readingTime,
							}))
						)
					),
				}}
			/>

			<main className="pb-8">
				<BlurFade delay={0.04}>
					<header className="mb-10 flex flex-col gap-5 border-b border-border pb-10 sm:flex-row sm:items-end sm:justify-between">
						<div>
							<h1 className="text-5xl font-semibold tracking-tighter sm:text-6xl">
								Blog
							</h1>
							<p className="mt-3 max-w-xl text-lg leading-relaxed text-muted-foreground">
								Things I worked out the hard way while building AI products
								and full-stack systems. Architecture decisions, retrieval,
								and what held up after launch.
							</p>
						</div>
						{/* "Subscribe" means the email list. It used to point at
						    /feed.xml, which dumped raw RSS XML on anyone who clicked
						    it. RSS is still offered, but labelled as RSS and marked
						    external so nobody expects an email signup. The signup
						    itself opens in a dialog rather than sitting on the page. */}
						<div className="flex w-fit shrink-0 items-center gap-2">
							<SubscribeButton source="blogs-index" />
							<Link
								href="/feed.xml"
								prefetch={false}
								className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-base font-medium text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
								title="RSS feed (XML, for feed readers)"
							>
								<Rss className="size-3.5" />
								RSS
							</Link>
						</div>
					</header>
				</BlurFade>

				<BlurFade delay={0.08}>
					<BlogExplorer posts={summaries} tags={tags} />
				</BlurFade>
			</main>
		</>
	);
}
