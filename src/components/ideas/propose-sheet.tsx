"use client";

import { proposeIdea } from "@/app/actions/ideas";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Loader2, Plus } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";

type Field =
	| "title"
	| "problem"
	| "proposal"
	| "audience"
	| "stack"
	| "scope"
	| "proposerName"
	| "proposerEmail"
	| "proposerGithub";

const EMPTY: Record<Field, string> = {
	title: "",
	problem: "",
	proposal: "",
	audience: "",
	stack: "",
	scope: "weeks",
	proposerName: "",
	proposerEmail: "",
	proposerGithub: "",
};

const SCOPES = [
	{ id: "weekend", label: "A weekend" },
	{ id: "weeks", label: "A few weeks" },
	{ id: "big", label: "Bigger than that" },
];

function FieldLabel({
	htmlFor,
	children,
	hint,
}: {
	htmlFor: string;
	children: React.ReactNode;
	hint?: string;
}) {
	return (
		<div className="mb-1.5 flex items-baseline justify-between gap-3">
			<Label htmlFor={htmlFor}>{children}</Label>
			{hint && <span className="text-xs text-muted-foreground">{hint}</span>}
		</div>
	);
}

/**
 * Proposing an idea, in a sheet rather than on its own page.
 *
 * A separate page would mean leaving the board to describe something you just
 * saw was missing from it, and coming back to a scroll position you lost. The
 * sheet keeps the list underneath, which is also the fastest way to notice your
 * idea is already there.
 */
export function ProposeSheet({
	trigger,
}: {
	/** Defaults to a pill button; the board header passes its own. */
	trigger?: React.ReactNode;
}) {
	const [open, setOpen] = useState(false);
	const [values, setValues] = useState(EMPTY);
	const [honeypot, setHoneypot] = useState("");
	const [error, setError] = useState<{ message: string; field?: Field } | null>(
		null
	);
	const [done, setDone] = useState<string | null>(null);
	const [pending, startTransition] = useTransition();
	const openedAt = useRef(0);

	// Timed from when the form appears, not from page load: the server rejects
	// anything filled faster than a person can read it.
	useEffect(() => {
		if (open) openedAt.current = Date.now();
	}, [open]);

	function set(field: Field, value: string) {
		setValues((v) => ({ ...v, [field]: value }));
		if (error?.field === field) setError(null);
	}

	function reset() {
		setValues(EMPTY);
		setDone(null);
		setError(null);
	}

	function submit(e: React.FormEvent) {
		e.preventDefault();
		setError(null);
		startTransition(async () => {
			const result = await proposeIdea({
				...values,
				website: honeypot,
				elapsed: Date.now() - openedAt.current,
			});
			if (result.ok) setDone(result.message);
			else setError({ message: result.error, field: result.field as Field });
		});
	}

	return (
		<Sheet
			open={open}
			onOpenChange={(next) => {
				setOpen(next);
				// Cleared on close so reopening is a fresh form rather than a
				// success screen from ten minutes ago.
				if (!next) window.setTimeout(reset, 250);
			}}
		>
			<SheetTrigger asChild>
				{trigger ?? (
					<button
						type="button"
						className="inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background transition-opacity hover:opacity-85"
					>
						<Plus className="size-4" />
						Propose an idea
					</button>
				)}
			</SheetTrigger>

			<SheetContent>
				<SheetHeader>
					<SheetTitle>Propose a project</SheetTitle>
					<SheetDescription className="mt-1.5">
						Something you wish existed. It goes on the board once I have read
						it, and if enough people want it, it becomes a real open-source
						project with a team.
					</SheetDescription>
				</SheetHeader>

				{done ? (
					<motion.div
						initial={{ opacity: 0, y: 8 }}
						animate={{ opacity: 1, y: 0 }}
						className="flex flex-1 flex-col items-start justify-center gap-4 px-6"
					>
						<span className="flex size-10 items-center justify-center rounded-full bg-foreground text-background">
							<Check className="size-5" />
						</span>
						<div>
							<p className="text-base font-semibold text-foreground">
								Idea received
							</p>
							<p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
								{done}
							</p>
						</div>
						<button
							type="button"
							onClick={() => setOpen(false)}
							className="rounded-full border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
						>
							Back to the board
						</button>
					</motion.div>
				) : (
					<form onSubmit={submit} className="flex min-h-0 flex-1 flex-col" noValidate>
						<ScrollArea className="min-h-0 flex-1">
							<div className="space-y-5 px-6 py-5">
								{/* Honeypot. Off-screen rather than display:none, because
								    some bots skip hidden fields but fill positioned ones. */}
								<div aria-hidden className="pointer-events-none absolute -left-[9999px]">
									<label htmlFor="website">Website</label>
									<input
										id="website"
										name="website"
										tabIndex={-1}
										autoComplete="off"
										value={honeypot}
										onChange={(e) => setHoneypot(e.target.value)}
									/>
								</div>

								<div>
									<FieldLabel htmlFor="idea-title">
										What is it called?
									</FieldLabel>
									<Input
										id="idea-title"
										value={values.title}
										onChange={(e) => set("title", e.target.value)}
										placeholder="A short, plain name"
										className={cn(error?.field === "title" && "border-destructive")}
									/>
								</div>

								<div>
									<FieldLabel
										htmlFor="idea-problem"
										hint={`${values.problem.trim().length}/60`}
									>
										What is broken today?
									</FieldLabel>
									<Textarea
										id="idea-problem"
										value={values.problem}
										onChange={(e) => set("problem", e.target.value)}
										rows={4}
										placeholder="The thing that annoys you, or the workaround everybody does instead. Concrete beats general."
										className={cn(error?.field === "problem" && "border-destructive")}
									/>
								</div>

								<div>
									<FieldLabel
										htmlFor="idea-proposal"
										hint={`${values.proposal.trim().length}/60`}
									>
										What should exist instead?
									</FieldLabel>
									<Textarea
										id="idea-proposal"
										value={values.proposal}
										onChange={(e) => set("proposal", e.target.value)}
										rows={4}
										placeholder="You do not need a spec. Enough that somebody else could picture it."
										className={cn(error?.field === "proposal" && "border-destructive")}
									/>
								</div>

								<div className="grid gap-5 sm:grid-cols-2">
									<div>
										<FieldLabel htmlFor="idea-audience" hint="optional">
											Who is it for?
										</FieldLabel>
										<Input
											id="idea-audience"
											value={values.audience}
											onChange={(e) => set("audience", e.target.value)}
											placeholder="Students, small teams, anyone"
										/>
									</div>

									<div>
										<FieldLabel htmlFor="idea-scope">How big is it?</FieldLabel>
										<Select
											value={values.scope}
											onValueChange={(v) => set("scope", v)}
										>
											<SelectTrigger id="idea-scope">
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												{SCOPES.map((s) => (
													<SelectItem key={s.id} value={s.id}>
														{s.label}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>
								</div>

								<div>
									<FieldLabel htmlFor="idea-stack" hint="optional">
										Anything it should be built with?
									</FieldLabel>
									<Input
										id="idea-stack"
										value={values.stack}
										onChange={(e) => set("stack", e.target.value)}
										placeholder="Next.js, Postgres (comma separated)"
									/>
								</div>

								<div className="border-t border-border pt-5">
									<p className="text-sm font-medium text-foreground">
										So I can tell you what happened
									</p>
									<p className="mt-1 text-xs text-muted-foreground">
										Your email is never shown on the board.
									</p>

									<div className="mt-4 grid gap-5 sm:grid-cols-2">
										<div>
											<FieldLabel htmlFor="idea-name">Name</FieldLabel>
											<Input
												id="idea-name"
												value={values.proposerName}
												onChange={(e) => set("proposerName", e.target.value)}
												autoComplete="name"
												className={cn(
													error?.field === "proposerName" && "border-destructive"
												)}
											/>
										</div>
										<div>
											<FieldLabel htmlFor="idea-email">Email</FieldLabel>
											<Input
												id="idea-email"
												type="email"
												value={values.proposerEmail}
												onChange={(e) => set("proposerEmail", e.target.value)}
												autoComplete="email"
												className={cn(
													error?.field === "proposerEmail" && "border-destructive"
												)}
											/>
										</div>
										<div className="sm:col-span-2">
											<FieldLabel htmlFor="idea-github" hint="optional">
												GitHub username
											</FieldLabel>
											<Input
												id="idea-github"
												value={values.proposerGithub}
												onChange={(e) => set("proposerGithub", e.target.value)}
												spellCheck={false}
												className={cn(
													error?.field === "proposerGithub" && "border-destructive"
												)}
											/>
										</div>
									</div>
								</div>
							</div>
						</ScrollArea>

						<div className="shrink-0 border-t border-border px-6 py-4">
							<AnimatePresence>
								{error && (
									<motion.p
										initial={{ opacity: 0, height: 0 }}
										animate={{ opacity: 1, height: "auto" }}
										exit={{ opacity: 0, height: 0 }}
										role="alert"
										className="mb-3 text-sm font-medium text-destructive"
									>
										{error.message}
									</motion.p>
								)}
							</AnimatePresence>

							<button
								type="submit"
								disabled={pending}
								className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background transition-opacity hover:opacity-85 disabled:opacity-50"
							>
								{pending && <Loader2 className="size-4 animate-spin" />}
								Send it
							</button>
						</div>
					</form>
				)}
			</SheetContent>
		</Sheet>
	);
}
