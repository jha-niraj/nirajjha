import { IdeaRow, type AdminIdea } from "@/components/admin/idea-row";
import { EmptyState, PageHeader } from "@/components/admin/ui";
import { getIdeaCounts, listAllIdeas } from "@/db/ideas";
import { cn } from "@/lib/utils";
import Link from "next/link";

export const dynamic = "force-dynamic";

const FILTERS = [
	{ id: "", label: "All" },
	{ id: "pending", label: "Pending" },
	{ id: "published", label: "Published" },
	{ id: "building", label: "Building" },
	{ id: "shipped", label: "Shipped" },
	{ id: "rejected", label: "Rejected" },
];

export default async function AdminIdeasPage({
	searchParams,
}: {
	searchParams: Promise<{ status?: string }>;
}) {
	const { status } = await searchParams;
	const [rows, counts] = await Promise.all([
		listAllIdeas(status || undefined),
		getIdeaCounts(),
	]);

	const ideas: AdminIdea[] = rows.map((r) => ({
		id: r.id,
		slug: r.slug,
		title: r.title,
		problem: r.problem,
		proposal: r.proposal,
		audience: r.audience,
		stack: r.stack ?? [],
		scope: r.scope,
		proposerName: r.proposerName,
		proposerEmail: r.proposerEmail,
		proposerGithub: r.proposerGithub,
		status: r.status,
		reviewNote: r.reviewNote,
		projectUrl: r.projectUrl,
		votes: Number(r.votes ?? 0),
		createdAt: r.createdAt.toISOString(),
	}));

	return (
		<>
			<PageHeader
				title="Ideas"
				description="Nothing reaches the board until you publish it. The note you write is shown publicly on the idea."
			/>

			<div className="mb-6 flex flex-wrap gap-2">
				{FILTERS.map((f) => {
					const on = (status ?? "") === f.id;
					const n = f.id
						? (counts[f.id] ?? 0)
						: Object.values(counts).reduce((a, b) => a + b, 0);
					return (
						<Link
							key={f.id || "all"}
							href={f.id ? `/admin/ideas?status=${f.id}` : "/admin/ideas"}
							className={cn(
								"rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors",
								on
									? "border-foreground bg-foreground text-background"
									: "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
							)}
						>
							{f.label}
							<span
								className={cn(
									"ml-1.5 tabular-nums",
									on ? "text-background/70" : "text-muted-foreground/70"
								)}
							>
								{n}
							</span>
						</Link>
					);
				})}
			</div>

			{ideas.length === 0 ? (
				<EmptyState
					title={status ? `Nothing ${status}` : "No ideas yet"}
					body="They arrive from the sheet on /ideas."
				/>
			) : (
				<ul className="flex flex-col gap-3">
					{ideas.map((idea) => (
						<IdeaRow key={idea.id} idea={idea} />
					))}
				</ul>
			)}
		</>
	);
}
