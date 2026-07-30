"use client";

import { subscribe } from "@/app/actions/subscribe";
import { useToast } from "@/components/toast";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Loader2, Mail } from "lucide-react";
import { useState, useTransition } from "react";

/**
 * Newsletter signup, as a dialog.
 *
 * It used to be a permanent card on the blog index and again at the foot of
 * every post, which cost a lot of vertical space on pages whose job is reading.
 * The form now lives behind a button, and the outcome is reported by a toast
 * rather than by swapping the card for a success panel that then sat there
 * taking up the same room.
 */

function SubscribeFields({
	source,
	onDone,
}: {
	source: string;
	onDone: () => void;
}) {
	const [email, setEmail] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [pending, startTransition] = useTransition();
	const { toast } = useToast();

	function onSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError(null);

		startTransition(async () => {
			const result = await subscribe(email, source);

			if (!result.ok) {
				// Validation problems stay next to the field being corrected. A
				// toast for "that is not an email" would point away from the fix.
				setError(result.error);
				return;
			}

			if (result.status === "already") {
				toast({
					tone: "info",
					title: result.message,
					description: "That address is already subscribed, nothing to do.",
				});
			} else {
				toast({
					tone: "success",
					title: result.message,
					description:
						result.status === "resubscribed"
							? "You will start getting new posts again."
							: "New posts land in your inbox. Unsubscribe any time.",
				});
			}

			setEmail("");
			onDone();
		});
	}

	return (
		<form onSubmit={onSubmit} className="mt-6 space-y-3">
			<label htmlFor={`subscribe-${source}`} className="sr-only">
				Email address
			</label>
			<div className="flex flex-col gap-2.5 sm:flex-row">
				<input
					id={`subscribe-${source}`}
					type="email"
					required
					autoFocus
					value={email}
					onChange={(e) => {
						setEmail(e.target.value);
						if (error) setError(null);
					}}
					placeholder="you@example.com"
					autoComplete="email"
					aria-invalid={Boolean(error)}
					aria-describedby={error ? `subscribe-error-${source}` : undefined}
					className="h-11 flex-1 rounded-full border border-border bg-background px-4 text-base font-medium text-foreground outline-none transition-colors placeholder:font-normal placeholder:text-muted-foreground focus:border-foreground/40"
				/>
				<button
					type="submit"
					disabled={pending}
					className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-foreground px-6 text-base font-semibold text-background transition-opacity hover:opacity-85 disabled:opacity-50"
				>
					{pending && <Loader2 className="size-4 animate-spin" />}
					Subscribe
				</button>
			</div>

			{error && (
				<p
					id={`subscribe-error-${source}`}
					role="alert"
					className="text-base font-medium text-destructive"
				>
					{error}
				</p>
			)}

			<p className="text-sm leading-relaxed text-muted-foreground">
				No spam. One email per post, and an unsubscribe link in every one.
			</p>
		</form>
	);
}

export function SubscribeDialog({
	source,
	children,
}: {
	/** Which page the signup came from, recorded against the subscriber. */
	source: string;
	/** The trigger. Anything focusable; it is cloned via Radix `asChild`. */
	children: React.ReactNode;
}) {
	const [open, setOpen] = useState(false);

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>{children}</DialogTrigger>
			<DialogContent className="dialog-stagger max-w-md">
				<div className="flex items-start gap-3">
					<span
						aria-hidden
						className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground"
					>
						<Mail className="size-4" />
					</span>
					<div className="min-w-0">
						<DialogTitle>Get new posts by email</DialogTitle>
						<DialogDescription className="mt-1.5">
							Occasional writing on AI engineering and full-stack systems.
						</DialogDescription>
					</div>
				</div>

				<SubscribeFields source={source} onDone={() => setOpen(false)} />
			</DialogContent>
		</Dialog>
	);
}

/** The standard trigger: a pill button matching the site's primary action. */
export function SubscribeButton({
	source,
	className,
	label = "Subscribe",
}: {
	source: string;
	className?: string;
	label?: string;
}) {
	return (
		<SubscribeDialog source={source}>
			<button
				type="button"
				className={cn(
					"inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-base font-semibold text-background transition-opacity hover:opacity-85",
					className
				)}
			>
				<Mail className="size-3.5" />
				{label}
			</button>
		</SubscribeDialog>
	);
}
