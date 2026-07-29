import { Comments } from "@/components/comments";
import BlurFade from "@/components/magicui/blur-fade";
import { PostEngagementBar } from "@/components/post-engagement";
import { PostArt } from "@/components/post-art";
import { PostEmbeds } from "@/components/post-embeds";
import { SubscribeButton } from "@/components/subscribe-form";
import { PostCard } from "@/components/post-card";
import { TableOfContents } from "@/components/toc";
import { getBlogPosts, getPost } from "@/data/blog";
import { DATA } from "@/data/resume";
import { getComments, getEngagement } from "@/db/queries";
import { categoryLabel } from "@/lib/categories";
import type { PostSummary } from "@/lib/post-types";
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

	const related: PostSummary[] = all
		.filter((p) => p.slug !== post.slug)
		.map((p) => ({
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
		}))
		.slice(0, 3);

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

			<main className="pb-8">
				<BlurFade delay={0.04}>
					<Link
						href="/blogs"
						className="group mb-8 inline-flex items-center gap-1.5 text-base font-medium text-muted-foreground transition-colors hover:text-foreground"
					>
						<ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-0.5" />
						All posts
					</Link>
				</BlurFade>

				<header className="mb-10">
					<BlurFade delay={0.08}>
						<div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
							{post.metadata.category && (
								<>
									<span className="rounded-full border border-border px-2.5 py-0.5 text-foreground">
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
						<h1 className="mt-4 max-w-4xl text-balance text-5xl font-semibold leading-[1.1] tracking-tighter sm:text-6xl">
							{post.metadata.title}
						</h1>
					</BlurFade>

					<BlurFade delay={0.16}>
						<p className="mt-5 max-w-2xl text-xl leading-relaxed text-muted-foreground">
							{post.metadata.summary}
						</p>
					</BlurFade>

					<BlurFade delay={0.2}>
						{/* 16/9 matches the art's 320x180 viewBox exactly. At 21/9 the
						    SVG was letterboxed: it fitted to width and left a dead band
						    above and below, which is why the frame looked mostly empty. */}
						<div className="mt-8 aspect-[16/9] w-full overflow-hidden rounded-2xl border border-border">
							<PostArt art={post.metadata.art} slug={post.slug} />
						</div>
					</BlurFade>
				</header>

				{/* Contents rail on the left, article on the right. Below lg the
				    rail collapses above the article and stops being sticky. */}
				<div className="grid gap-10 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-14">
					<aside className="lg:order-1">
						<BlurFade delay={0.24}>
							<TableOfContents headings={post.headings} />
						</BlurFade>
					</aside>

					<div className="min-w-0 lg:order-2">
						<BlurFade delay={0.24}>
							<article
								className="prose max-w-[68ch]"
								dangerouslySetInnerHTML={{ __html: post.source }}
							/>
						</BlurFade>
						{/* Upgrades the YouTube and mermaid placeholders inside the
						    article above. Renders no markup of its own. */}
						<PostEmbeds />

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
