import BlurFade from "@/components/magicui/blur-fade";
import { BlogExplorer } from "@/components/blog-explorer";
import { getAllTags, getBlogPosts } from "@/data/blog";
import { DATA } from "@/data/resume";
import { getCommentCounts, getSiteTotals, getViewCounts } from "@/db/queries";
import type { PostSummary } from "@/lib/post-types";
import { buildBlogIndexGraph } from "@/lib/schema";
import { StatIcon, type StatIconName } from "@/components/stat-icons";
import { SubscribeButton } from "@/components/subscribe-form";
import { ArrowRight, Rss } from "lucide-react";
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
		canonical: "/",
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
		url: "/",
	},
	twitter: {
		card: "summary_large_image",
		title: `${TITLE}, ${DATA.shortName}`,
		description: DESCRIPTION,
	},
};

export default async function HomePage() {
	const posts = await getBlogPosts();
	const tags = await getAllTags();
	const slugs = posts.map((p) => p.slug);

	const [views, commentCounts, totals] = await Promise.all([
		getViewCounts(slugs),
		getCommentCounts(slugs),
		getSiteTotals(slugs),
	]);

	const totalReads = Object.values(views).reduce((n, v) => n + v, 0);

	/*
	 * Four counters, always four, so the 2x2 grid is never ragged. Three in a
	 * two-column grid left an orphan on the second row, which is what made the
	 * block look broken rather than designed.
	 *
	 * Topics is deliberately not here: the tag chips sit a few hundred pixels
	 * below and already say how many there are, so a "Topics 7" counter is the
	 * same fact twice.
	 *
	 * These are shown at whatever they currently are. I would normally hold
	 * subscriber counts back until they flatter you, but you asked for the real
	 * number on screen, so it is the real number.
	 */
	const engagementIsLive =
		totalReads > 0 || totals.likes > 0 || totals.subscribers > 0;

	const visibleStats: {
		label: string;
		value: number;
		icon: StatIconName;
	}[] = engagementIsLive
		? [
				{ label: "Posts", value: posts.length, icon: "posts" },
				{ label: "Total reads", value: totalReads, icon: "reads" },
				{ label: "Likes", value: totals.likes, icon: "likes" },
				{
					label: "Subscribers",
					value: totals.subscribers,
					icon: "subscribers",
				},
			]
		: // Database unreachable or genuinely empty. A row of zeros says nothing
			// true and looks broken, so fall back to the two facts that come from
			// the filesystem and are always right.
			[
				{ label: "Posts", value: posts.length, icon: "posts" },
				{ label: "Topics", value: tags.length, icon: "reads" },
			];

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
				{/* Editorial masthead. This is the site's front door now, so it
				    introduces the writing and the person, rather than acting as a
				    section header the way it did at /blogs. */}
				{/*
				 * Two columns from `lg` up: the title and standfirst on the left, the
				 * actions and counts on the right.
				 *
				 * Stacked, these five blocks pushed the first post most of a viewport
				 * down the page, so the index opened on chrome rather than on writing.
				 * Side by side the header costs roughly the height of the heading
				 * alone. It collapses back to one column below `lg`, where there is no
				 * width to spend and the stacked order is the right reading order.
				 */}
				<header className="mb-12 grid gap-x-12 gap-y-8 border-b border-border pb-12 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
					<div>
						<BlurFade delay={0.04}>
							<div className="flex items-center gap-2.5">
								<span className="relative flex size-1.5">
									<span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-foreground/50" />
									<span className="relative inline-flex size-1.5 rounded-full bg-foreground" />
								</span>
								<p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
									Writing by {DATA.shortName}
								</p>
							</div>
						</BlurFade>

						<BlurFade delay={0.08}>
							<h1 className="display-heading display-heading-xl mt-5 max-w-2xl text-balance text-[2rem] leading-[1.15] sm:text-[2.75rem]">
								Notes from building AI products that have to keep working
							</h1>
						</BlurFade>

						<BlurFade delay={0.12}>
							<p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground">
								Architecture decisions and the trade-offs behind them, retrieval
								that survives production, and the things I got wrong first.
								Written from systems that shipped, not from tutorials.
							</p>
						</BlurFade>
					</div>

					<div className="lg:text-right">
						<BlurFade delay={0.16}>
							<div className="flex flex-wrap items-center gap-2 lg:justify-end">
								<SubscribeButton source="home" />
								<Link
									href="/portfolio"
									className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
								>
									About me
									<ArrowRight className="size-3.5" />
								</Link>
								<Link
									href="/feed.xml"
									prefetch={false}
									className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
									title="RSS feed (XML, for feed readers)"
								>
									<Rss className="size-3.5" />
									RSS
								</Link>
							</div>
						</BlurFade>

						{/* Counts, not decoration: they tell a first-time reader how much
						    is actually here before they scroll. */}
						<BlurFade delay={0.2}>
							<dl className="mt-7 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-4 lg:grid-cols-2">
								{visibleStats.map((stat) => (
									<div
										key={stat.label}
										className="bg-background px-4 py-3 text-left"
									>
										<dt className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">
											<StatIcon name={stat.icon} />
											{stat.label}
										</dt>
										<dd className="mt-1.5 text-xl font-semibold tabular-nums tracking-tight">
											{stat.value.toLocaleString()}
										</dd>
									</div>
								))}
							</dl>
						</BlurFade>
					</div>
				</header>

				<BlurFade delay={0.24}>
					<BlogExplorer posts={summaries} tags={tags} />
				</BlurFade>

				<BlurFade delay={0.28} inView>
					<section className="mt-16 rounded-2xl border border-border p-6 sm:p-8">
						<p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
							Open source
						</p>
						<h2 className="mt-3 max-w-lg text-xl font-semibold tracking-tight">
							Want to learn this by doing it?
						</h2>
						<p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
							I run an open-source project like a real engineering team: a
							board, cycles, proper code review and written feedback. You join
							as a team member, not as a student.
						</p>
						<Link
							href="https://buildrhq.com/contribute"
							target="_blank"
							rel="noopener noreferrer"
							className="mt-5 inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background transition-opacity hover:opacity-85"
						>
							How it works
							<ArrowRight className="size-3.5" />
						</Link>
					</section>
				</BlurFade>
			</main>
		</>
	);
}
