import { Comments } from "@/components/comments";
import { PostEngagementBar } from "@/components/post-engagement";
import { PostArt } from "@/components/post-art";
import { SubscribeForm } from "@/components/subscribe-form";
import { PostCard } from "@/components/post-card";
import { TableOfContents } from "@/components/toc";
import { getBlogPosts, getPost } from "@/data/blog";
import { DATA } from "@/data/resume";
import { getComments, getEngagement } from "@/db/queries";
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

export async function generateMetadata({
	params,
}: {
	params: { slug: string };
}): Promise<Metadata> {
	const post = await getPost(params.slug);
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
	params: { slug: string };
}) {
	const post = await getPost(params.slug);
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
				<Link
					href="/blogs"
					className="group mb-8 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
				>
					<ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-0.5" />
					All posts
				</Link>

				<header className="mb-10">
					<div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
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

					<h1 className="mt-4 max-w-4xl text-balance text-4xl font-semibold leading-[1.1] tracking-tighter sm:text-5xl">
						{post.metadata.title}
					</h1>

					<p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">
						{post.metadata.summary}
					</p>

					<div className="mt-8 aspect-[21/9] w-full overflow-hidden rounded-2xl border border-border">
						<PostArt art={post.metadata.art} slug={post.slug} />
					</div>
				</header>

				{/* Contents rail on the left, article on the right. Below lg the
				    rail collapses above the article and stops being sticky. */}
				<div className="grid gap-10 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-14">
					<aside className="lg:order-1">
						<TableOfContents headings={post.headings} />
					</aside>

					<div className="min-w-0 lg:order-2">
						<article
							className="prose max-w-[68ch]"
							dangerouslySetInnerHTML={{ __html: post.source }}
						/>

						<div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-8">
							<PostEngagementBar slug={post.slug} initial={engagement} />
							<p className="text-sm text-muted-foreground">
								Written by{" "}
								<Link
									href="/"
									className="font-medium text-foreground underline underline-offset-4"
								>
									{DATA.shortName}
								</Link>
							</p>
						</div>

						<div className="max-w-[68ch]">
							<SubscribeForm
								source={`post:${post.slug}`}
								className="mt-10"
							/>
							<Comments slug={post.slug} initial={comments} />
						</div>
					</div>
				</div>

				{related.length > 0 && (
					<section className="mt-24 border-t border-border pt-10">
						<h2 className="mb-6 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
							Keep reading
						</h2>
						<ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
							{related.map((p) => (
								<li key={p.slug}>
									<PostCard post={p} />
								</li>
							))}
						</ul>
					</section>
				)}
			</main>
		</>
	);
}
