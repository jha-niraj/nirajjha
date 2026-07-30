"use client";

import { applyToContribute } from "@/app/actions/apply";
import { CHALLENGES, SOURCES } from "@/data/challenges";
import { Input, Textarea } from "@/components/ui/input";
import { Label as UILabel } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, Check, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";

type Field =
	| "name"
	| "email"
	| "github"
	| "linkUrl"
	| "background"
	| "challengeId"
	| "pitch"
	| "source"
	| "sourceDetail";

const EMPTY: Record<Field, string> = {
	name: "",
	email: "",
	github: "",
	linkUrl: "",
	background: "",
	challengeId: "",
	pitch: "",
	source: "",
	sourceDetail: "",
};

const ANSWER_MIN = 80;

function Label({
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
			<UILabel htmlFor={htmlFor}>{children}</UILabel>
			{hint && <span className="text-xs text-muted-foreground">{hint}</span>}
		</div>
	);
}

export function ApplyForm() {
	const [values, setValues] = useState(EMPTY);
	const [error, setError] = useState<{ message: string; field?: Field } | null>(
		null
	);
	const [done, setDone] = useState<string | null>(null);
	const [pending, startTransition] = useTransition();

	function set(field: Field, value: string) {
		setValues((v) => ({ ...v, [field]: value }));
		if (error?.field === field) setError(null);
	}

	function submit(e: React.FormEvent) {
		e.preventDefault();
		setError(null);
		startTransition(async () => {
			const result = await applyToContribute(values);
			if (result.ok) setDone(result.message);
			else setError({ message: result.error, field: result.field as Field });
		});
	}

	if (done) {
		return (
			<motion.div
				initial={{ opacity: 0, y: 8 }}
				animate={{ opacity: 1, y: 0 }}
				className="rounded-2xl border border-border bg-card p-6 sm:p-8"
			>
				<span className="flex size-10 items-center justify-center rounded-full bg-foreground text-background">
					<Check className="size-5" />
				</span>
				<h3 className="mt-4 text-lg font-semibold text-foreground">
					Application received
				</h3>
				<p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
					{done}
				</p>
			</motion.div>
		);
	}

	const chosen = CHALLENGES.find((c) => c.id === values.challengeId);
	const answerLeft = ANSWER_MIN - values.pitch.trim().length;

	return (
		<form
			onSubmit={submit}
			className="rounded-2xl border border-border bg-card p-6 sm:p-8"
			noValidate
		>
			<div className="grid gap-5 sm:grid-cols-2">
				<div>
					<Label htmlFor="ap-name">Name</Label>
					<Input
						id="ap-name"
						value={values.name}
						onChange={(e) => set("name", e.target.value)}
						placeholder="Ada Lovelace"
						autoComplete="name"
						className={cn(error?.field === "name" && "border-destructive")}
					/>
				</div>

				<div>
					<Label htmlFor="ap-email">Email</Label>
					<Input
						id="ap-email"
						type="email"
						value={values.email}
						onChange={(e) => set("email", e.target.value)}
						placeholder="you@example.com"
						autoComplete="email"
						className={cn(error?.field === "email" && "border-destructive")}
					/>
				</div>

				<div>
					<Label htmlFor="ap-github">GitHub username</Label>
					<Input
						id="ap-github"
						value={values.github}
						onChange={(e) => set("github", e.target.value)}
						placeholder="jha-niraj"
						autoComplete="off"
						spellCheck={false}
						className={cn(error?.field === "github" && "border-destructive")}
					/>
				</div>

				<div>
					<Label htmlFor="ap-background" hint="optional">
						Where you are now
					</Label>
					<Input
						id="ap-background"
						value={values.background}
						onChange={(e) => set("background", e.target.value)}
						placeholder="Final year CS, or self taught"
						/>
				</div>

				<div className="sm:col-span-2">
					<Label htmlFor="ap-link" hint="optional">
						Resume, portfolio or a repo
					</Label>
					<Input
						id="ap-link"
						type="url"
						value={values.linkUrl}
						onChange={(e) => set("linkUrl", e.target.value)}
						placeholder="https://"
						className={cn(error?.field === "linkUrl" && "border-destructive")}
					/>
				</div>
			</div>

			{/* The question. Deliberately the largest thing on the form: it is the
			    only part that carries real signal, and putting it last after a
			    wall of contact fields would make it read as an afterthought. */}
			<fieldset className="mt-8 border-t border-border pt-7">
				<legend className="sr-only">Pick a question</legend>
				<p className="text-sm font-medium text-foreground">
					Pick one and answer it
				</p>
				<p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
					Three or four sentences is plenty. There is no right answer and I am
					not checking whether you got it. I am reading how you think about a
					system you have not seen.
				</p>

				<div className="mt-4 grid gap-2">
					{CHALLENGES.map((c) => {
						const on = values.challengeId === c.id;
						return (
							<label
								key={c.id}
								className={cn(
									"cursor-pointer rounded-xl border px-4 py-3 transition-colors",
									on
										? "border-foreground/40 bg-muted/50"
										: "border-border hover:border-foreground/25"
								)}
							>
								<div className="flex items-start gap-3">
									<input
										type="radio"
										name="challenge"
										value={c.id}
										checked={on}
										onChange={() => set("challengeId", c.id)}
										className="mt-1 size-3.5 shrink-0 accent-[hsl(var(--foreground))]"
									/>
									<div className="min-w-0">
										<span className="text-sm font-medium text-foreground">
											{c.label}
										</span>
										<AnimatePresence initial={false}>
											{on && (
												<motion.div
													initial={{ opacity: 0, height: 0 }}
													animate={{ opacity: 1, height: "auto" }}
													exit={{ opacity: 0, height: 0 }}
													transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
													className="overflow-hidden"
												>
													<p className="pt-2 text-sm leading-relaxed text-muted-foreground">
														{c.prompt}
													</p>
													{c.hint && (
														<Link
															href={c.hint.href}
															className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground underline underline-offset-4 hover:text-foreground"
														>
															{c.hint.text}
															<ArrowUpRight className="size-3" />
														</Link>
													)}
												</motion.div>
											)}
										</AnimatePresence>
									</div>
								</div>
							</label>
						);
					})}
				</div>

				{error?.field === "challengeId" && (
					<p role="alert" className="mt-2 text-sm font-medium text-destructive">
						{error.message}
					</p>
				)}

				<div className="mt-5">
					<Label
						htmlFor="ap-pitch"
						hint={
							values.pitch.trim() && answerLeft > 0
								? `${answerLeft} more characters`
								: undefined
						}
					>
						Your answer
					</Label>
					<Textarea
						id="ap-pitch"
						value={values.pitch}
						onChange={(e) => set("pitch", e.target.value)}
						rows={6}
						disabled={!chosen}
						placeholder={
							chosen
								? "How would you approach it?"
								: "Pick a question above first"
						}
						className={cn(
							"resize-y",
							error?.field === "pitch" && "border-destructive"
						)}
					/>
				</div>
			</fieldset>

			<div className="mt-7 grid gap-5 border-t border-border pt-7 sm:grid-cols-2">
				<div>
					<Label htmlFor="ap-source" hint="optional">
						How did you find this?
					</Label>
					<Select
						value={values.source}
						onValueChange={(v) => set("source", v)}
					>
						<SelectTrigger id="ap-source">
							<SelectValue placeholder="Prefer not to say" />
						</SelectTrigger>
						<SelectContent>
							{SOURCES.map((s) => (
								<SelectItem key={s.id} value={s.id}>
									{s.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				<AnimatePresence initial={false}>
					{values.source && (
						<motion.div
							initial={{ opacity: 0, y: -4 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -4 }}
							transition={{ duration: 0.18 }}
						>
							<Label htmlFor="ap-source-detail" hint="optional">
								{values.source === "post"
									? "Which post?"
									: values.source === "university"
										? "Which one?"
										: "Any detail?"}
							</Label>
							<Input
								id="ap-source-detail"
								value={values.sourceDetail}
								onChange={(e) => set("sourceDetail", e.target.value)}
								placeholder={
									values.source === "post"
										? "The one about adding a column"
										: ""
								}
							/>
						</motion.div>
					)}
				</AnimatePresence>
			</div>

			<AnimatePresence>
				{error && error.field !== "challengeId" && (
					<motion.p
						initial={{ opacity: 0, height: 0 }}
						animate={{ opacity: 1, height: "auto" }}
						exit={{ opacity: 0, height: 0 }}
						role="alert"
						className="mt-5 text-sm font-medium text-destructive"
					>
						{error.message}
					</motion.p>
				)}
			</AnimatePresence>

			<div className="mt-7 flex flex-wrap items-center gap-4">
				<button
					type="submit"
					disabled={pending}
					className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background transition-opacity hover:opacity-85 disabled:opacity-50"
				>
					{pending && <Loader2 className="size-4 animate-spin" />}
					Send application
				</button>
				<p className="text-xs text-muted-foreground">
					No account, no CV screen. I read these myself.
				</p>
			</div>
		</form>
	);
}
