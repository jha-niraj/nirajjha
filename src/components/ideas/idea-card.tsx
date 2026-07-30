import { PostArt } from "@/components/post-art";
import { VoteButton } from "@/components/ideas/vote-button";
import type { IdeaView } from "@/db/ideas";
import { cn } from "@/lib/utils";
import Link from "next/link";

export const SCOPE_LABELS: Record<string, string> = {
	weekend: "A weekend",
	weeks: "A few weeks",
	big: "Bigger",
};

export const STATUS_LABELS: Record<string, string> = {
	published: "Open",
	building: "Being built",
	shipped: "Shipped",
	rejected: "Not taking this one",
};

export function StatusChip({ status }: { status: string }) {
	if (!STATUS_LABELS[status]) return null;
	return (
		<span
			className={cn(
				"rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
				status === "building" && "border-foreground bg-foreground text-background",
				status === "shipped" && "border-foreground text-foreground",
				status === "rejected" && "border-border text-muted-foreground",
				status === "published" && "border-border text-muted-foreground"
			)}
		>
			{STATUS_LABELS[status]}
		</span>
	);
}

export function IdeaCard({ idea }: { idea: IdeaView }) {
	return (
		<article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card transition-colors hover:border-foreground/30">
			<div className="relative aspect-[16/7] w-full overflow-hidden border-b border-border">
				<PostArt art={idea.art ?? undefined} slug={idea.slug} />
				<div className="absolute left-3 top-3 flex gap-1.5">
					<StatusChip status={idea.status} />
				</div>
			</div>

			<div className="flex flex-1 gap-4 p-5">
				{/* Outside the stretched link, or the whole card would submit a vote. */}
				<div className="relative z-10 shrink-0">
					<VoteButton
						slug={idea.slug}
						votes={idea.votes}
						voted={idea.voted}
					/>
				</div>

				<div className="min-w-0 flex-1">
					<h3 className="text-base font-semibold leading-snug tracking-tight">
						<Link
							href={`/ideas/${idea.slug}`}
							className="after:absolute after:inset-0"
						>
							{idea.title}
						</Link>
					</h3>
					<p className="mt-1.5 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
						{idea.problem}
					</p>

					<div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
						<span>{SCOPE_LABELS[idea.scope] ?? idea.scope}</span>
						<span className="text-border">/</span>
						<span>by {idea.proposerName}</span>
						{idea.stack.slice(0, 2).map((s) => (
							<span key={s} className="contents">
								<span className="text-border">/</span>
								<span>{s}</span>
							</span>
						))}
					</div>
				</div>
			</div>
		</article>
	);
}
