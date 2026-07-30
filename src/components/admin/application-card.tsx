"use client";

import { decideApplication } from "@/app/actions/admin";
import { StatusBadge } from "@/components/admin/ui";
import { Textarea } from "@/components/ui/input";
import { findChallenge, sourceLabel } from "@/data/challenges";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { ExternalLink, Loader2 } from "lucide-react";
import { useState, useTransition } from "react";

export type ApplicationView = {
	id: string;
	name: string;
	email: string;
	github: string;
	linkUrl: string | null;
	background: string | null;
	challengeId: string | null;
	pitch: string;
	source: string | null;
	sourceDetail: string | null;
	status: string;
	reviewNote: string | null;
	createdAt: string;
};

export function ApplicationCard({ app }: { app: ApplicationView }) {
	const [open, setOpen] = useState(app.status === "pending");
	const [reason, setReason] = useState(app.reviewNote ?? "");
	const [error, setError] = useState<string | null>(null);
	const [pending, startTransition] = useTransition();

	const challenge = app.challengeId ? findChallenge(app.challengeId) : undefined;

	function decide(status: string) {
		setError(null);
		startTransition(async () => {
			const result = await decideApplication(app.id, status, reason);
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
				<div className="min-w-0 flex-1">
					<div className="flex flex-wrap items-center gap-2">
						<span className="text-sm font-semibold">{app.name}</span>
						<StatusBadge status={app.status} />
					</div>
					<p className="mt-1 truncate text-xs text-muted-foreground">
						{app.email} · @{app.github}
						{app.background ? ` · ${app.background}` : ""}
					</p>
					<p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
						{app.pitch}
					</p>
				</div>
				<span className="shrink-0 text-xs text-muted-foreground">
					{new Date(app.createdAt).toLocaleDateString("en-GB", {
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
						<div className="border-t border-border p-4">
							{/* Straight to what they have actually shipped, which is worth
							    more than the rest of the form put together. */}
							<div className="flex flex-wrap gap-2">
								{[
									{
										label: "Contributions",
										href: `https://github.com/${app.github}?tab=overview`,
									},
									{
										label: "Repositories",
										href: `https://github.com/${app.github}?tab=repositories`,
									},
									...(app.linkUrl
										? [{ label: "What they sent", href: app.linkUrl }]
										: []),
								].map((link) => (
									<a
										key={link.label}
										href={link.href}
										target="_blank"
										rel="noopener noreferrer"
										className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
									>
										{link.label}
										<ExternalLink className="size-3" />
									</a>
								))}
							</div>

							<p className="mt-4 text-xs text-muted-foreground">
								Found via {sourceLabel(app.source)}
								{app.sourceDetail ? ` (${app.sourceDetail})` : ""}
							</p>

							<div className="mt-4 rounded-lg border border-border bg-background p-4">
								<p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
									{challenge?.label ?? app.challengeId ?? "No question recorded"}
								</p>
								{challenge && (
									<p className="mt-1.5 text-xs italic text-muted-foreground">
										{challenge.prompt}
									</p>
								)}
								<p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed">
									{app.pitch}
								</p>
							</div>

							<div className="mt-4">
								<label
									htmlFor={`note-${app.id}`}
									className="text-xs font-medium text-muted-foreground"
								>
									Why (recorded with the decision)
								</label>
								<Textarea
									id={`note-${app.id}`}
									value={reason}
									onChange={(e) => setReason(e.target.value)}
									rows={2}
									placeholder="What made this a yes or a no?"
									className="mt-1.5"
								/>
							</div>

							{error && (
								<p role="alert" className="mt-2 text-xs font-medium text-destructive">
									{error}
								</p>
							)}

							<div className="mt-3 flex flex-wrap items-center gap-2">
								{(["invited", "reviewing", "declined"] as const).map((s) => (
									<button
										key={s}
										type="button"
										onClick={() => decide(s)}
										disabled={pending}
										className={cn(
											"rounded-full px-3.5 py-1.5 text-xs font-semibold capitalize transition-opacity disabled:opacity-40",
											s === "invited"
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
								{app.status === "invited" && (
									<span className="text-xs text-muted-foreground">
										Now invite them in SyncHq.
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
