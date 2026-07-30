"use client";

import { decideIdea } from "@/app/actions/admin-ideas";
import { StatusBadge } from "@/components/admin/ui";
import { Input, Textarea } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowBigUp, ExternalLink, Loader2 } from "lucide-react";
import { useState, useTransition } from "react";

export type AdminIdea = {
	id: string;
	slug: string;
	title: string;
	problem: string;
	proposal: string;
	audience: string | null;
	stack: string[];
	scope: string;
	proposerName: string;
	proposerEmail: string;
	proposerGithub: string | null;
	status: string;
	reviewNote: string | null;
	projectUrl: string | null;
	votes: number;
	createdAt: string;
};

const ACTIONS = ["published", "building", "shipped", "rejected"] as const;

export function IdeaRow({ idea }: { idea: AdminIdea }) {
	const [open, setOpen] = useState(idea.status === "pending");
	const [note, setNote] = useState(idea.reviewNote ?? "");
	const [url, setUrl] = useState(idea.projectUrl ?? "");
	const [error, setError] = useState<string | null>(null);
	const [pending, startTransition] = useTransition();

	function decide(status: string) {
		setError(null);
		startTransition(async () => {
			const result = await decideIdea(idea.id, status, note, url);
			if (!result.ok) setError(result.error);
		});
	}

	return (
		<li className="rounded-xl border border-border bg-card">
			<button
				type="button"
				onClick={() => setOpen((v) => !v)}
				className="flex w-full items-start gap-4 p-4 text-left"
			>
				<span className="flex w-11 shrink-0 flex-col items-center rounded-lg border border-border py-1.5">
					<ArrowBigUp className="size-4 text-muted-foreground" />
					<span className="text-xs font-semibold tabular-nums">{idea.votes}</span>
				</span>

				<div className="min-w-0 flex-1">
					<div className="flex flex-wrap items-center gap-2">
						<span className="text-sm font-semibold">{idea.title}</span>
						<StatusBadge status={idea.status} />
					</div>
					<p className="mt-1 truncate text-xs text-muted-foreground">
						{idea.proposerName} · {idea.proposerEmail}
					</p>
					<p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
						{idea.problem}
					</p>
				</div>

				<span className="shrink-0 text-xs text-muted-foreground">
					{new Date(idea.createdAt).toLocaleDateString("en-GB", {
						day: "numeric",
						month: "short",
					})}
				</span>
			</button>

			<AnimatePresence initial={false}>
				{open && (
					<motion.div
						initial={{ height: 0, opacity: 0 }}
						animate={{ height: "auto", opacity: 1 }}
						exit={{ height: 0, opacity: 0 }}
						transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
						className="overflow-hidden"
					>
						<div className="space-y-4 border-t border-border p-4">
							<div className="flex flex-wrap gap-2 text-xs">
								{idea.proposerGithub && (
									<a
										href={`https://github.com/${idea.proposerGithub}?tab=overview`}
										target="_blank"
										rel="noopener noreferrer"
										className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 font-medium text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
									>
										GitHub
										<ExternalLink className="size-3" />
									</a>
								)}
								<a
									href={`/ideas/${idea.slug}`}
									target="_blank"
									rel="noopener noreferrer"
									className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 font-medium text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
								>
									View on the board
									<ExternalLink className="size-3" />
								</a>
								<span className="inline-flex items-center rounded-full border border-border px-3 py-1.5 text-muted-foreground">
									{idea.scope}
								</span>
							</div>

							<div className="rounded-lg border border-border bg-background p-4 text-sm">
								<p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
									Problem
								</p>
								<p className="mt-1.5 whitespace-pre-wrap leading-relaxed">
									{idea.problem}
								</p>
								<p className="mt-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
									Proposal
								</p>
								<p className="mt-1.5 whitespace-pre-wrap leading-relaxed">
									{idea.proposal}
								</p>
								{idea.stack.length > 0 && (
									<p className="mt-4 text-xs text-muted-foreground">
										Stack: {idea.stack.join(", ")}
									</p>
								)}
							</div>

							<div>
								<label
									htmlFor={`note-${idea.id}`}
									className="text-xs font-medium text-muted-foreground"
								>
									What happened to it (shown publicly on the idea)
								</label>
								<Textarea
									id={`note-${idea.id}`}
									value={note}
									onChange={(e) => setNote(e.target.value)}
									rows={2}
									placeholder="Why this is going ahead, or why not."
									className="mt-1.5"
								/>
							</div>

							<div>
								<label
									htmlFor={`url-${idea.id}`}
									className="text-xs font-medium text-muted-foreground"
								>
									Project link (when it is being built)
								</label>
								<Input
									id={`url-${idea.id}`}
									value={url}
									onChange={(e) => setUrl(e.target.value)}
									placeholder="https://"
									className="mt-1.5"
								/>
							</div>

							{error && (
								<p role="alert" className="text-xs font-medium text-destructive">
									{error}
								</p>
							)}

							<div className="flex flex-wrap items-center gap-2">
								{ACTIONS.map((s) => (
									<button
										key={s}
										type="button"
										onClick={() => decide(s)}
										disabled={pending}
										className={cn(
											"rounded-full px-3.5 py-1.5 text-xs font-semibold capitalize transition-opacity disabled:opacity-40",
											s === "published" || s === "building"
												? "bg-foreground text-background hover:opacity-85"
												: "border border-border text-muted-foreground hover:text-foreground"
										)}
									>
										{s}
									</button>
								))}
								{pending && (
									<Loader2 className="size-3.5 animate-spin text-muted-foreground" />
								)}
								{idea.status === "building" && (
									<span className="text-xs text-muted-foreground">
										The proposer was emailed.
									</span>
								)}
							</div>
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</li>
	);
}
