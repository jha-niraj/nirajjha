"use client";

import { react, trackView } from "@/app/actions/engagement";
import type { PostEngagement, ReactionKind } from "@/db/queries";
import { cn } from "@/lib/utils";
import { useVisitorId } from "@/lib/visitor";
import { Eye, ThumbsDown, ThumbsUp } from "lucide-react";
import { useEffect, useState, useTransition } from "react";

/**
 * View counter plus like/dislike.
 *
 * Posts are statically generated, so the count cannot be rendered on the
 * server. This mounts, records the view, and swaps in the real numbers. The
 * server-rendered values are used as the initial state so the bar is never
 * empty and the layout does not jump.
 */
export function PostEngagementBar({
	slug,
	initial,
}: {
	slug: string;
	initial: PostEngagement;
}) {
	const visitorId = useVisitorId();
	const [state, setState] = useState<PostEngagement>(initial);
	const [pending, startTransition] = useTransition();

	useEffect(() => {
		if (!visitorId) return;
		let cancelled = false;

		// One view per mount. A refresh counts again, which is the same thing
		// every simple counter on the internet does.
		trackView(slug, visitorId).then((next) => {
			if (!cancelled && next.views > 0) setState(next);
		});

		return () => {
			cancelled = true;
		};
	}, [slug, visitorId]);

	function vote(kind: ReactionKind) {
		if (!visitorId) return;

		// Optimistic: toggling off when it is already picked, switching
		// otherwise. The server response replaces this either way.
		setState((prev) => {
			const was = prev.myReaction;
			const next: PostEngagement = { ...prev };
			if (was === "like") next.likes -= 1;
			if (was === "dislike") next.dislikes -= 1;
			if (was === kind) {
				next.myReaction = null;
			} else {
				next.myReaction = kind;
				if (kind === "like") next.likes += 1;
				else next.dislikes += 1;
			}
			return next;
		});

		startTransition(async () => {
			try {
				setState(await react(slug, visitorId, kind));
			} catch {
				/* keep the optimistic value; a reload will reconcile */
			}
		});
	}

	const buttons: { kind: ReactionKind; icon: typeof ThumbsUp; count: number }[] =
		[
			{ kind: "like", icon: ThumbsUp, count: state.likes },
			{ kind: "dislike", icon: ThumbsDown, count: state.dislikes },
		];

	return (
		<div className="flex flex-wrap items-center gap-2">
			<span className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-sm font-medium text-muted-foreground">
				<Eye className="size-4" />
				{state.views.toLocaleString()}
				<span className="text-muted-foreground/70">
					{state.views === 1 ? "view" : "views"}
				</span>
			</span>

			{buttons.map(({ kind, icon: Icon, count }) => {
				const active = state.myReaction === kind;
				return (
					<button
						key={kind}
						type="button"
						onClick={() => vote(kind)}
						disabled={!visitorId || pending}
						aria-pressed={active}
						aria-label={kind === "like" ? "Like this post" : "Dislike this post"}
						className={cn(
							"inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-50",
							active
								? "border-foreground bg-foreground text-background"
								: "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
						)}
					>
						<Icon className="size-4" />
						<span className="tabular-nums">{count}</span>
					</button>
				);
			})}
		</div>
	);
}
