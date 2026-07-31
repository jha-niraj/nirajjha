import { Comments } from "@/components/comments";
import BlurFade from "@/components/magicui/blur-fade";
import { PostEngagementBar } from "@/components/post-engagement";
import { PostEmbeds } from "@/components/post-embeds";
import { PostHeadings } from "@/components/post-headings";
import { PostTerms } from "@/components/post-terms";
import { ReadingProgress } from "@/components/reading-progress";
import { SubscribeButton } from "@/components/subscribe-form";
import { PostCard } from "@/components/post-card";
import { TableOfContents } from "@/components/toc";
import { getBlogPosts, getPost } from "@/data/blog";
import { DATA } from "@/data/resume";
import { getComments, getEngagement } from "@/db/queries";
import { categoryLabel } from "@/lib/categories";
import type { PostSummary } from "@/lib/post-types";
import { rankRelated } from "@/lib/related";
import { buildPostGraph } from "@/lib/schema";
import { formatShortDate } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

export const revalidate = 300;

/**
 * Posts live at the root (`/hello`), so this segment would otherwise swallow
 * every unknown path. Pinning it to the known slugs means anything else falls
 * through to the 404 instead of rendering an empty post.
 */
export const dynamicParams = false;

export async function generateStaticParams() {
	const posts = await getBlogPosts();
	return posts.map((post) => ({ slug: post.slug }));
}

/**
 * `params` is a Promise from Next 15 onward. Awaiting it is not optional: the
 * synchronous shape is gone, so reading `params.slug` directly now yields
 * undefined and every post 404s.
 */
export async function generateMetadata({
	params,
}: {
	params: Promise<{ slug: string }>;
}): Promise<Metadata> {
	const { slug } = await params;
	const post = await getPost(slug);
	if (!post) return {};

	const { title, summary, publishedAt, updatedAt, image, tags } = post.metadata;
	const url = `/${post.slug}`;
	// No cover photo any more: posts fall through to the generated OG card
	// unless they explicitly set `image:` for social.
	const social = image;

	return {
		title,
		description: summary,
		keywords: tags,
		authors: [{ name: DATA.name, url: DATA.url }],
		alternates: { canonical: url },
		openGraph: {
			type: "article",
			title,
			description: summary,
			url,
			publishedTime: publishedAt,
			modifiedTime: updatedAt ?? publishedAt,
			authors: [DATA.name],
			tags: [...tags],
			...(social ? { images: [{ url: social }] } : {}),
		},
		twitter: {
			card: "summary_large_image",
			title,
			description: summary,
			creator: "@iamnirajjha",
			...(social ? { images: [social] } : {}),
		},
	};
}

export default async function PostPage({
	params,
}: {
	params: Promise<{ slug: string }>;
}) {
	const { slug } = await params;
	const post = await getPost(slug);
	if (!post) notFound();

	const all = await getBlogPosts();
	const [engagement, comments] = await Promise.all([
		getEngagement(post.slug),
		getComments(post.slug),
	]);

	// Ranked by shared category and tags, so finishing a database post offers the
	// other database post rather than whatever happened to ship most recently.
	const related: PostSummary[] = rankRelated(post, all).map((p) => ({
			slug: p.slug,
			title: p.metadata.title,
			summary: p.metadata.summary,
			publishedAt: p.metadata.publishedAt,
			readingTime: p.readingTime,
			tags: p.metadata.tags,
			category: p.metadata.category,
			art: p.metadata.art,
			featured: p.metadata.featured,
			outline: [],
			views: 0,
			comments: 0,
	}));

	const graph = buildPostGraph({
		slug: post.slug,
		title: post.metadata.title,
		summary: post.metadata.summary,
		publishedAt: post.metadata.publishedAt,
		updatedAt: post.metadata.updatedAt,
		image: post.metadata.image,
		tags: post.metadata.tags,
		readingTime: post.readingTime,
	});

	return (
		<>
			<script
				type="application/ld+json"
				suppressHydrationWarning
				dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
			/>

			<ReadingProgress targetId="post-article" />

			<main className="pb-8">
				<BlurFade delay={0.04}>
					<Link
						href="/"
						className="group mb-8 inline-flex items-center gap-1.5 text-base font-medium text-muted-foreground transition-colors hover:text-foreground"
					>
						<ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-0.5" />
						All posts
					</Link>
				</BlurFade>

				<header className="mb-8">
					<BlurFade delay={0.08}>
						<div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
							{post.metadata.category && (
								<>
									<span className="rounded-full border border-border px-2 py-0.5 text-foreground">
										{categoryLabel(post.metadata.category)}
									</span>
									<span className="text-border">/</span>
								</>
							)}
							<time dateTime={post.metadata.publishedAt}>
								{formatShortDate(post.metadata.publishedAt)}
							</time>
							<span className="text-border">/</span>
							<span>{post.readingTime} min read</span>
							{post.metadata.tags.map((tag) => (
								<span key={tag} className="contents">
									<span className="text-border">/</span>
									<span>{tag}</span>
								</span>
							))}
						</div>
					</BlurFade>

					<BlurFade delay={0.12}>
						<h1 className="mt-3.5 max-w-3xl text-balance display-heading text-[1.75rem] leading-[1.2] sm:text-[2.125rem]">
							{post.metadata.title}
						</h1>
					</BlurFade>

					<BlurFade delay={0.16}>
						<p className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground">
							{post.metadata.summary}
						</p>
					</BlurFade>

					{/* No hero art here. The piece already identifies the post on
					    the card and in the OG image; repeating it full width above
					    the article pushed the first paragraph below the fold and
					    added nothing a reader had not just seen. */}
				</header>

				{/* Contents rail on the left, article on the right. Below lg the
				    rail collapses above the article and stops being sticky. */}
				<div className="grid gap-10 lg:grid-cols-[220px_minmax(0,72ch)] lg:justify-center lg:gap-12">
					{/* `self-start` + `h-full` on the animation wrapper is what makes
					    the rail inside actually stick. A sticky element can only
					    travel within its parent's box, and BlurFade renders a
					    content-height div: without `h-full` the nav is already as
					    tall as its parent and has nowhere to move, so it scrolls
					    away like static content. */}
					<aside className="lg:order-1 lg:h-full">
						<BlurFade delay={0.24} className="lg:block lg:h-full">
							<TableOfContents headings={post.headings} />
						</BlurFade>
					</aside>

					<div className="min-w-0 lg:order-2">
						<BlurFade delay={0.24}>
							<article
								id="post-article"
								className="prose max-w-[68ch]"
								dangerouslySetInnerHTML={{ __html: post.source }}
							/>
						</BlurFade>
						{/* All four render nothing: they walk the article DOM after
						    paint and wire behaviour onto what the pipeline planted. */}
						<PostEmbeds />
						<PostTerms rootId="post-article" />
						<PostHeadings rootId="post-article" />

						<BlurFade delay={0.06} inView>
							<div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-8">
								<PostEngagementBar slug={post.slug} initial={engagement} />
								<p className="text-base text-muted-foreground">
									Written by{" "}
									<Link
										href="/"
										className="font-medium text-foreground underline underline-offset-4"
									>
										{DATA.shortName}
									</Link>
								</p>
							</div>
						</BlurFade>

						<div className="max-w-[68ch]">
							{/* One line instead of the card that used to sit here. The
							    form itself is in the dialog the button opens. */}
							<div className="mt-10 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border px-5 py-4">
								<p className="text-base text-muted-foreground">
									Liked this? Get new posts by email.
								</p>
								<SubscribeButton
									source={`post:${post.slug}`}
									className="px-3.5 py-1.5 text-sm"
								/>
							</div>
							<Comments slug={post.slug} initial={comments} />
						</div>
					</div>
				</div>

				{related.length > 0 && (
					<section className="mt-24 border-t border-border pt-10">
						<BlurFade delay={0.04} inView>
							<h2 className="mb-6 text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
								Keep reading
							</h2>
						</BlurFade>
						<ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
							{related.map((p, i) => (
								<li key={p.slug} className="flex">
									<BlurFade
										delay={0.08 + i * 0.06}
										inView
										className="flex w-full"
									>
										<PostCard post={p} />
									</BlurFade>
								</li>
							))}
						</ul>
					</section>
				)}
			</main>
		</>
	);
}
