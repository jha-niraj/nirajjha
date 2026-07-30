"use client";

import { voteForIdea } from "@/app/actions/ideas";
import { cn } from "@/lib/utils";
import { ArrowBigUp } from "lucide-react";
import { useState, useTransition } from "react";

/**
 * Interest, not a ballot.
 *
 * Optimistic on click, because a vote that waits for a round trip feels broken,
 * and the worst case is a number that corrects itself a moment later. The
 * server returns the authoritative count and it always wins.
 */
export function VoteButton({
	slug,
	votes,
	voted,
	size = "sm",
}: {
	slug: string;
	votes: number;
	voted: boolean;
	size?: "sm" | "lg";
}) {
	const [state, setState] = useState({ votes, voted });
	const [pending, startTransition] = useTransition();
	const [error, setError] = useState<string | null>(null);

	function vote() {
		setError(null);
		setState((s) => ({
			votes: s.voted ? s.votes - 1 : s.votes + 1,
			voted: !s.voted,
		}));

		startTransition(async () => {
			const result = await voteForIdea(slug);
			if (result.ok) setState({ votes: result.votes, voted: result.voted });
			else {
				setError(result.error);
				setState({ votes, voted });
			}
		});
	}

	return (
		<div className="flex flex-col items-center gap-1">
			<button
				type="button"
				onClick={vote}
				disabled={pending}
				aria-pressed={state.voted}
				aria-label={state.voted ? "Remove your vote" : "I would use this"}
				className={cn(
					"flex flex-col items-center justify-center rounded-xl border transition-colors disabled:opacity-60",
					size === "lg" ? "h-16 w-14" : "h-12 w-11",
					state.voted
						? "border-foreground bg-foreground text-background"
						: "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
				)}
			>
				<ArrowBigUp
					className={cn(
						size === "lg" ? "size-5" : "size-4",
						state.voted && "fill-current"
					)}
				/>
				<span
					className={cn(
						"font-semibold tabular-nums",
						size === "lg" ? "text-sm" : "text-xs"
					)}
				>
					{state.votes}
				</span>
			</button>
			{error && (
				<span role="alert" className="text-[10px] text-destructive">
					{error}
				</span>
			)}
		</div>
	);
}
