import {
	ApplicationCard,
	type ApplicationView,
} from "@/components/admin/application-card";
import { EmptyState, PageHeader } from "@/components/admin/ui";
import { getApplicationCounts, getApplications } from "@/db/analytics";
import { cn } from "@/lib/utils";
import Link from "next/link";

export const dynamic = "force-dynamic";

const FILTERS = [
	{ id: "", label: "All" },
	{ id: "pending", label: "Pending" },
	{ id: "reviewing", label: "Reviewing" },
	{ id: "invited", label: "Invited" },
	{ id: "declined", label: "Declined" },
];

export default async function AdminApplicationsPage({
	searchParams,
}: {
	searchParams: Promise<{ status?: string }>;
}) {
	const { status } = await searchParams;
	const [rows, counts] = await Promise.all([
		getApplications(status || undefined),
		getApplicationCounts(),
	]);

	const apps: ApplicationView[] = rows.map((r) => ({
		id: r.id,
		name: r.name,
		email: r.email,
		github: r.github,
		linkUrl: r.linkUrl,
		background: r.background,
		challengeId: r.challengeId,
		pitch: r.pitch,
		source: r.source,
		sourceDetail: r.sourceDetail,
		status: r.status,
		reviewNote: r.reviewNote,
		createdAt: r.createdAt.toISOString(),
	}));

	return (
		<>
			<PageHeader
				title="Applications"
				description="People who want to contribute. Read the answer, look at their GitHub, decide."
			/>

			<div className="mb-6 flex flex-wrap gap-2">
				{FILTERS.map((f) => {
					const on = (status ?? "") === f.id;
					const n = f.id ? (counts[f.id] ?? 0) : Object.values(counts).reduce((a, b) => a + b, 0);
					return (
						<Link
							key={f.id || "all"}
							href={f.id ? `/admin/applications?status=${f.id}` : "/admin/applications"}
							className={cn(
								"rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors",
								on
									? "border-foreground bg-foreground text-background"
									: "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
							)}
						>
							{f.label}
							<span className={cn("ml-1.5 tabular-nums", on ? "text-background/70" : "text-muted-foreground/70")}>
								{n}
							</span>
						</Link>
					);
				})}
			</div>

			{apps.length === 0 ? (
				<EmptyState
					title={status ? `Nothing ${status}` : "No applications yet"}
					body="They arrive from the form at /contribute."
				/>
			) : (
				<ul className="flex flex-col gap-3">
					{apps.map((app) => (
						<ApplicationCard key={app.id} app={app} />
					))}
				</ul>
			)}
		</>
	);
}
