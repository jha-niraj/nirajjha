import { PostArt } from "@/components/post-art";
import { categoryLabel } from "@/lib/categories";
import type { PostSummary } from "@/lib/post-types";
import { cn, formatShortDate } from "@/lib/utils";
import { ArrowUpRight, Eye, MessageSquare } from "lucide-react";
import Link from "next/link";

export function PostCard({
	post,
	className,
	compact,
}: {
	post: PostSummary;
	className?: string;
	/** Narrow variant used inside the homepage marquee. */
	compact?: boolean;
}) {
	return (
		<article
			className={cn(
				"group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card transition-colors duration-300 hover:border-foreground/30",
				className
			)}
		>
			<div className="relative aspect-[16/9] w-full overflow-hidden border-b border-border">
				<PostArt art={post.art} slug={post.slug} />

				{post.featured && (
					<span className="theme-vt-glass absolute left-3 top-3 rounded-full bg-background/90 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-foreground backdrop-blur">
						Featured
					</span>
				)}

				{post.category && (
					<span className="theme-vt-glass absolute right-3 top-3 rounded-full bg-background/90 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground backdrop-blur">
						{categoryLabel(post.category)}
					</span>
				)}
			</div>

			<div
				className={cn(
					"flex flex-1 flex-col gap-3",
					compact ? "p-4" : "p-5"
				)}
			>
				<div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] font-medium uppercase tracking-wider text-muted-foreground">
					<time dateTime={post.publishedAt}>
						{formatShortDate(post.publishedAt)}
					</time>
					<span className="text-border">/</span>
					<span>{post.readingTime} min</span>
					{post.views > 0 && (
						<>
							<span className="text-border">/</span>
							<span className="inline-flex items-center gap-1">
								<Eye className="size-3" />
								{post.views.toLocaleString()}
							</span>
						</>
					)}
					{post.comments > 0 && (
						<>
							<span className="text-border">/</span>
							<span className="inline-flex items-center gap-1">
								<MessageSquare className="size-3" />
								{post.comments}
							</span>
						</>
					)}
				</div>

				<h3
					className={cn(
						"font-semibold leading-snug tracking-tight text-foreground",
						compact ? "text-lg" : "text-xl"
					)}
				>
					{/* Stretched link: the whole card is the hit area, but the
					    accessible name still comes from the heading alone. */}
					<Link href={`/${post.slug}`} className="after:absolute after:inset-0">
						{post.title}
					</Link>
				</h3>

				<p
					className={cn(
						"text-base leading-relaxed text-muted-foreground",
						compact ? "line-clamp-2" : "line-clamp-3"
					)}
				>
					{post.summary}
				</p>

				<div className="mt-auto flex items-end justify-between gap-3 pt-2">
					{post.tags.length > 0 && (
						<ul className="flex flex-wrap gap-1.5">
							{post.tags.slice(0, compact ? 2 : 3).map((tag) => (
								<li
									key={tag}
									className="rounded-md border border-border px-2 py-0.5 text-[12px] font-medium text-muted-foreground"
								>
									{tag}
								</li>
							))}
						</ul>
					)}
					<ArrowUpRight className="size-4 shrink-0 text-muted-foreground transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground" />
				</div>
			</div>
		</article>
	);
}
