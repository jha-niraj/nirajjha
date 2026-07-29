"use client";

import { subscribe } from "@/app/actions/subscribe";
import { cn } from "@/lib/utils";
import { Check, Loader2, Mail } from "lucide-react";
import { useState, useTransition } from "react";

type State =
	| { kind: "idle" }
	| { kind: "done"; message: string }
	| { kind: "error"; message: string };

export function SubscribeForm({
	source,
	className,
	compact,
}: {
	/** Which page the signup came from, recorded against the subscriber. */
	source: string;
	className?: string;
	compact?: boolean;
}) {
	const [email, setEmail] = useState("");
	const [state, setState] = useState<State>({ kind: "idle" });
	const [pending, startTransition] = useTransition();

	function onSubmit(e: React.FormEvent) {
		e.preventDefault();
		startTransition(async () => {
			const result = await subscribe(email, source);
			if (result.ok) {
				setState({ kind: "done", message: result.message });
				setEmail("");
			} else {
				setState({ kind: "error", message: result.error });
			}
		});
	}

	if (state.kind === "done") {
		return (
			<div
				id="subscribe"
				className={cn(
					"scroll-mt-28 flex items-center gap-3 rounded-2xl border border-border bg-card p-5",
					className
				)}
			>
				<span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-foreground text-background">
					<Check className="size-4" />
				</span>
				<div>
					<p className="text-sm font-semibold text-foreground">
						{state.message}
					</p>
					<p className="mt-0.5 text-sm text-muted-foreground">
						New posts land in your inbox. No spam, unsubscribe any time.
					</p>
				</div>
			</div>
		);
	}

	return (
		<div
			id="subscribe"
			className={cn(
				"scroll-mt-28 rounded-2xl border border-border bg-card",
				compact ? "p-5" : "p-6 sm:p-8",
				className
			)}
		>
			<div className="flex items-start gap-3">
				<span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground">
					<Mail className="size-4" />
				</span>
				<div className="min-w-0">
					<h2
						className={cn(
							"font-semibold tracking-tight text-foreground",
							compact ? "text-base" : "text-xl"
						)}
					>
						Get new posts by email
					</h2>
					<p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
						Occasional writing on AI engineering and full-stack systems. No
						spam, unsubscribe any time.
					</p>
				</div>
			</div>

			<form
				onSubmit={onSubmit}
				className="mt-5 flex flex-col gap-2.5 sm:flex-row"
			>
				<label htmlFor={`subscribe-${source}`} className="sr-only">
					Email address
				</label>
				<input
					id={`subscribe-${source}`}
					type="email"
					required
					value={email}
					onChange={(e) => {
						setEmail(e.target.value);
						if (state.kind === "error") setState({ kind: "idle" });
					}}
					placeholder="you@example.com"
					autoComplete="email"
					aria-invalid={state.kind === "error"}
					aria-describedby={
						state.kind === "error" ? `subscribe-error-${source}` : undefined
					}
					className="h-11 flex-1 rounded-full border border-border bg-background px-4 text-sm font-medium text-foreground outline-none transition-colors placeholder:font-normal placeholder:text-muted-foreground focus:border-foreground/40"
				/>
				<button
					type="submit"
					disabled={pending}
					className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-foreground px-6 text-sm font-semibold text-background transition-opacity hover:opacity-85 disabled:opacity-50"
				>
					{pending && <Loader2 className="size-4 animate-spin" />}
					Subscribe
				</button>
			</form>

			{state.kind === "error" && (
				<p
					id={`subscribe-error-${source}`}
					role="alert"
					className="mt-2.5 text-sm font-medium text-destructive"
				>
					{state.message}
				</p>
			)}
		</div>
	);
}
