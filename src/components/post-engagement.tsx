"use client";

import { react, trackView } from "@/app/actions/engagement";
import type { PostEngagement, ReactionKind } from "@/db/queries";
import { cn } from "@/lib/utils";
import {
	readCachedReaction,
	useIsHydrated,
	writeCachedReaction,
} from "@/lib/visitor";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
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
	const hydrated = useIsHydrated();
	const [state, setState] = useState<PostEngagement>(initial);
	const [pending, startTransition] = useTransition();
	const reduced = useReducedMotion();

	// The page is static and its HTML is shared by every reader, so the server
	// cannot render "you liked this" for one person. The locally cached vote
	// fills that gap on the very first client paint, and the server's real
	// answer replaces it a moment later. Without this the button always starts
	// neutral and visibly flips once the round trip lands.
	const myReaction = hydrated
		? (state.myReaction ?? readCachedReaction(slug))
		: state.myReaction;

	useEffect(() => {
		let cancelled = false;

		// One view per mount. A refresh counts again, which is the same thing
		// every simple counter on the internet does.
		trackView(slug).then((next) => {
			if (cancelled || next.views === 0) return;
			setState(next);
			// Reconcile the cache with what the database actually holds.
			writeCachedReaction(slug, next.myReaction);
		});

		return () => {
			cancelled = true;
		};
	}, [slug]);

	function vote(kind: ReactionKind) {
		// Optimistic: toggling off when it is already picked, switching
		// otherwise. The server response replaces this either way.
		const was = myReaction;
		const optimistic = was === kind ? null : kind;

		setState((prev) => {
			const next: PostEngagement = { ...prev };
			if (was === "like") next.likes -= 1;
			if (was === "dislike") next.dislikes -= 1;
			if (optimistic === "like") next.likes += 1;
			if (optimistic === "dislike") next.dislikes += 1;
			next.myReaction = optimistic;
			return next;
		});
		writeCachedReaction(slug, optimistic);

		startTransition(async () => {
			try {
				const next = await react(slug, kind);
				setState(next);
				writeCachedReaction(slug, next.myReaction);
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
			<span className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-base font-medium text-muted-foreground">
				<Eye className="size-4" />
				{state.views.toLocaleString()}
				<span className="text-muted-foreground/70">
					{state.views === 1 ? "view" : "views"}
				</span>
			</span>

			{buttons.map(({ kind, icon: Icon, count }) => {
				const active = myReaction === kind;
				return (
					<motion.button
						key={kind}
						type="button"
						onClick={() => vote(kind)}
						disabled={pending}
						aria-pressed={active}
						aria-label={kind === "like" ? "Like this post" : "Dislike this post"}
						whileTap={reduced ? undefined : { scale: 0.94 }}
						transition={{ type: "spring", stiffness: 500, damping: 28 }}
						className={cn(
							"inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-base font-medium transition-colors disabled:opacity-50",
							active
								? "border-foreground bg-foreground text-background"
								: "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
						)}
					>
						{/* The icon nudges when the vote lands, so the button confirms
						    itself even when the count stays visually similar. */}
						<motion.span
							animate={reduced || !active ? {} : { scale: [1, 1.25, 1] }}
							transition={{ duration: 0.32, ease: "easeOut" }}
							className="inline-flex"
						>
							<Icon className="size-4" />
						</motion.span>

						{/* Rolls the old number out and the new one in. */}
						<span className="relative inline-block min-w-[1ch] text-center tabular-nums">
							<AnimatePresence mode="popLayout" initial={false}>
								<motion.span
									key={count}
									initial={reduced ? { opacity: 0 } : { opacity: 0, y: -8 }}
									animate={{ opacity: 1, y: 0 }}
									exit={reduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
									transition={{ duration: 0.18, ease: "easeOut" }}
									className="inline-block"
								>
									{count}
								</motion.span>
							</AnimatePresence>
						</span>
					</motion.button>
				);
			})}
		</div>
	);
}
