import { BarList, LineChart } from "@/components/admin/chart";
import { EmptyState, PageHeader, StatCard } from "@/components/admin/ui";
import {
	getDailyViews,
	getOverview,
	getPostAnalytics,
	getRecentComments,
	getSourceBreakdown,
} from "@/db/analytics";
import { sourceLabel } from "@/data/challenges";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
	const [overview, daily, postRows, recentComments, sources] =
		await Promise.all([
			getOverview(),
			getDailyViews(30),
			getPostAnalytics(),
			getRecentComments(6),
			getSourceBreakdown(),
		]);

	const last7 = daily.slice(-7).reduce((n, d) => n + d.value, 0);
	const prev7 = daily.slice(-14, -7).reduce((n, d) => n + d.value, 0);
	// Guarded: from a zero baseline any traffic is infinite growth, which is a
	// meaningless number to print.
	const trend =
		prev7 > 0 ? Math.round(((last7 - prev7) / prev7) * 100) : null;

	return (
		<>
			<PageHeader
				title="Overview"
				description="Traffic, engagement and the application queue."
			/>

			<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
				<StatCard
					label="Views"
					value={overview.views}
					hint={
						trend === null
							? `${last7} in the last 7 days`
							: `${trend >= 0 ? "+" : ""}${trend}% vs previous 7 days`
					}
				/>
				<StatCard
					label="Reactions"
					value={overview.likes + overview.dislikes}
					hint={`${overview.likes} up, ${overview.dislikes} down`}
				/>
				<StatCard label="Comments" value={overview.comments} href="/admin/blogs" />
				<StatCard label="Subscribers" value={overview.subscribers} />
			</div>

			<div className="mt-6 grid gap-4 lg:grid-cols-3">
				<LineChart
					points={daily}
					label="views"
					className="lg:col-span-2"
					height={200}
				/>

				<div className="flex flex-col gap-3">
					<StatCard
						label="Applications waiting"
						value={overview.pendingApplications}
						hint="Pending review"
						href="/admin/applications"
					/>
					<StatCard
						label="Published posts"
						value={overview.posts}
						href="/admin/blogs"
					/>
				</div>
			</div>

			<div className="mt-10 grid gap-8 lg:grid-cols-2">
				<section>
					<h2 className="mb-3 text-sm font-semibold tracking-tight">
						Most read
					</h2>
					{postRows.length === 0 ? (
						<EmptyState title="No traffic recorded yet" />
					) : (
						<BarList
							items={postRows.slice(0, 6).map((p) => ({
								label: p.title,
								value: p.views,
							}))}
						/>
					)}
				</section>

				<section>
					<h2 className="mb-3 text-sm font-semibold tracking-tight">
						Where applicants come from
					</h2>
					{sources.length === 0 ? (
						<EmptyState title="No applications yet" />
					) : (
						<BarList
							items={sources.map((s) => ({
								label: sourceLabel(s.source === "unknown" ? null : s.source),
								value: s.n,
							}))}
						/>
					)}
				</section>
			</div>

			<section className="mt-10">
				<h2 className="mb-3 text-sm font-semibold tracking-tight">
					Latest comments
				</h2>
				{recentComments.length === 0 ? (
					<EmptyState title="No comments yet" />
				) : (
					<ul className="divide-y divide-border rounded-xl border border-border">
						{recentComments.map((c) => (
							<li key={c.id} className="p-4">
								<div className="flex items-baseline justify-between gap-3">
									<span className="text-sm font-medium">{c.authorName}</span>
									<Link
										href={`/admin/blogs/${c.slug}`}
										className="shrink-0 text-xs text-muted-foreground hover:text-foreground"
									>
										{c.slug}
									</Link>
								</div>
								<p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">
									{c.body}
								</p>
							</li>
						))}
					</ul>
				)}
			</section>
		</>
	);
}
