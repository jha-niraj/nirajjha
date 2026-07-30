import { EmptyState, PageHeader, StatCard } from "@/components/admin/ui";
import { LineChart } from "@/components/admin/chart";
import { getDailyViews, getPostDetail } from "@/db/analytics";
import { categoryLabel } from "@/lib/categories";
import { formatShortDate } from "@/lib/utils";
import { ArrowLeft, ExternalLink } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminPostPage({
	params,
}: {
	params: Promise<{ slug: string }>;
}) {
	const { slug } = await params;
	const [detail, daily] = await Promise.all([
		getPostDetail(slug),
		getDailyViews(30, slug),
	]);
	if (!detail) notFound();

	const { post, comments } = detail;
	const reactions = post.likes + post.dislikes;
	// Not a real engagement rate: views are counted per mount, so a refresh
	// counts again. It is a trend line, not a metric to report to anyone.
	const ratio = post.views > 0 ? (reactions / post.views) * 100 : 0;

	return (
		<>
			<Link
				href="/admin/blogs"
				className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
			>
				<ArrowLeft className="size-3.5" />
				All posts
			</Link>

			<PageHeader
				title={post.title}
				description={post.summary}
				action={
					<Link
						href={`/${post.slug}`}
						target="_blank"
						className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border px-3.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
					>
						View live
						<ExternalLink className="size-3.5" />
					</Link>
				}
			/>

			<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
				<StatCard label="Views" value={post.views} />
				<StatCard
					label="Likes"
					value={post.likes}
					hint={post.dislikes > 0 ? `${post.dislikes} dislikes` : undefined}
				/>
				<StatCard label="Comments" value={comments.length} />
				<StatCard
					label="Reaction rate"
					value={`${ratio.toFixed(1)}%`}
					hint="Reactions per view"
				/>
			</div>

			<LineChart points={daily} label="views" className="mt-6" height={180} />

			<dl className="mt-8 grid gap-x-8 gap-y-3 rounded-xl border border-border p-5 sm:grid-cols-2">
				{[
					["Slug", `/${post.slug}`],
					["Category", post.category ? categoryLabel(post.category) : "-"],
					["Kind", post.kind ?? "-"],
					["Published", formatShortDate(post.publishedAt)],
					["Reading time", `${post.readingTime} min`],
					["Tags", post.tags?.length ? post.tags.join(", ") : "-"],
					[
						"Emailed",
						post.broadcastSentAt
							? formatShortDate(String(post.broadcastSentAt).slice(0, 10))
							: "Not sent",
					],
				].map(([label, value]) => (
					<div key={label} className="flex justify-between gap-4">
						<dt className="text-sm text-muted-foreground">{label}</dt>
						<dd className="text-sm font-medium">{value}</dd>
					</div>
				))}
			</dl>

			<section className="mt-10">
				<h2 className="mb-3 text-sm font-semibold tracking-tight">
					Comments ({comments.length})
				</h2>
				{comments.length === 0 ? (
					<EmptyState title="No comments on this post yet" />
				) : (
					<ul className="divide-y divide-border rounded-xl border border-border">
						{comments.map((c) => (
							<li key={c.id} className="p-4">
								<div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
									<span className="text-sm font-medium">{c.authorName}</span>
									<span className="text-xs text-muted-foreground">
										{formatShortDate(c.createdAt.toISOString().slice(0, 10))}
									</span>
									{c.parentId && (
										<span className="rounded-full border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground">
											reply
										</span>
									)}
									{c.isDeleted && (
										<span className="rounded-full border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground">
											removed
										</span>
									)}
								</div>
								<p className="mt-1.5 whitespace-pre-wrap text-sm text-muted-foreground">
									{c.isDeleted ? "(removed)" : c.body}
								</p>
							</li>
						))}
					</ul>
				)}
			</section>
		</>
	);
}
