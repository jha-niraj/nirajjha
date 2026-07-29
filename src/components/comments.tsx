"use client";

import {
	loadComments,
	postComment,
	removeComment,
} from "@/app/actions/engagement";
import type { CommentNode } from "@/db/queries";
import { cn } from "@/lib/utils";
import { useRememberedName, useVisitorId } from "@/lib/visitor";
import { CornerDownRight, Loader2, MessageSquare, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState, useTransition } from "react";

/* -------------------------------------------------------------------------- */

function relativeTime(iso: string) {
	const then = new Date(iso).getTime();
	const mins = Math.round((Date.now() - then) / 60000);
	if (mins < 1) return "just now";
	if (mins < 60) return `${mins}m ago`;
	const hours = Math.round(mins / 60);
	if (hours < 24) return `${hours}h ago`;
	const days = Math.round(hours / 24);
	if (days < 30) return `${days}d ago`;
	return new Date(iso).toLocaleDateString("en-GB", {
		day: "numeric",
		month: "short",
		year: "numeric",
	});
}

function initials(name: string) {
	return name
		.split(/\s+/)
		.slice(0, 2)
		.map((w) => w[0])
		.join("")
		.toUpperCase();
}

function countAll(nodes: CommentNode[]): number {
	return nodes.reduce(
		(n, c) => n + (c.isDeleted ? 0 : 1) + countAll(c.replies),
		0
	);
}

/* -------------------------------------------------------------------------- */

function CommentForm({
	slug,
	parentId,
	onDone,
	onCancel,
	autoFocus,
	compact,
}: {
	slug: string;
	parentId: string | null;
	onDone: (next: CommentNode[]) => void;
	onCancel?: () => void;
	autoFocus?: boolean;
	compact?: boolean;
}) {
	const visitorId = useVisitorId();
	const [name, setName] = useRememberedName();
	const [body, setBody] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [pending, startTransition] = useTransition();

	function submit(e: React.FormEvent) {
		e.preventDefault();
		if (!visitorId) return;
		setError(null);

		startTransition(async () => {
			const result = await postComment({
				slug,
				parentId,
				authorName: name,
				body,
				visitorId,
			});

			if (result.ok) {
				setBody("");
				onDone(result.comments);
				onCancel?.();
			} else {
				setError(result.error);
			}
		});
	}

	return (
		<form onSubmit={submit} className="space-y-3">
			<div className={cn("grid gap-3", compact ? "" : "sm:grid-cols-[200px_1fr]")}>
				<input
					value={name}
					onChange={(e) => setName(e.target.value)}
					placeholder="Your name"
					maxLength={60}
					required
					aria-label="Your name"
					className="h-10 rounded-lg border border-border bg-card px-3 text-sm font-medium text-foreground outline-none transition-colors placeholder:font-normal placeholder:text-muted-foreground focus:border-foreground/40"
				/>
				<textarea
					value={body}
					onChange={(e) => setBody(e.target.value)}
					placeholder={parentId ? "Write a reply" : "Say something"}
					rows={compact ? 2 : 3}
					maxLength={2000}
					required
					autoFocus={autoFocus}
					aria-label="Comment"
					className="resize-y rounded-lg border border-border bg-card px-3 py-2.5 text-sm leading-relaxed text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-foreground/40"
				/>
			</div>

			<div className="flex flex-wrap items-center gap-3">
				<button
					type="submit"
					disabled={pending || !visitorId || body.trim().length < 2}
					className="inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-xs font-semibold text-background transition-opacity hover:opacity-85 disabled:opacity-40"
				>
					{pending && <Loader2 className="size-3.5 animate-spin" />}
					{parentId ? "Reply" : "Post comment"}
				</button>

				{onCancel && (
					<button
						type="button"
						onClick={onCancel}
						className="text-xs font-medium text-muted-foreground underline underline-offset-4 transition-colors hover:text-foreground"
					>
						Cancel
					</button>
				)}

				<span className="ml-auto text-[11px] text-muted-foreground">
					{body.length}/2000
				</span>
			</div>

			{error && (
				<p role="alert" className="text-xs font-medium text-destructive">
					{error}
				</p>
			)}
		</form>
	);
}

/* -------------------------------------------------------------------------- */

function CommentItem({
	comment,
	slug,
	depth,
	onChange,
}: {
	comment: CommentNode;
	slug: string;
	depth: number;
	onChange: (next: CommentNode[]) => void;
}) {
	const visitorId = useVisitorId();
	const [replying, setReplying] = useState(false);
	const [pending, startTransition] = useTransition();

	// Threads nest without limit in the data. Visually they stop indenting
	// after three levels so a deep argument does not slide off a phone screen;
	// the parent is still shown above each reply, so the structure stays clear.
	const indent = Math.min(depth, 3);

	function onDelete() {
		if (!visitorId) return;
		startTransition(async () => {
			onChange(await removeComment(slug, comment.id, visitorId));
		});
	}

	return (
		<li className={cn(indent > 0 && "border-l border-border pl-4 sm:pl-6")}>
			<div className="py-4">
				<div className="flex items-center gap-2.5">
					<span
						aria-hidden
						className="flex size-7 shrink-0 items-center justify-center rounded-full border border-border bg-muted text-[10px] font-semibold text-muted-foreground"
					>
						{comment.isDeleted ? "?" : initials(comment.authorName)}
					</span>
					<span className="text-sm font-semibold text-foreground">
						{comment.isDeleted ? "Removed" : comment.authorName}
					</span>
					{comment.isMine && !comment.isDeleted && (
						<span className="rounded-full border border-border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
							You
						</span>
					)}
					<time
						dateTime={comment.createdAt}
						className="text-xs text-muted-foreground"
					>
						{relativeTime(comment.createdAt)}
					</time>
				</div>

				<p
					className={cn(
						"mt-2.5 whitespace-pre-wrap pl-[2.375rem] text-sm leading-relaxed",
						comment.isDeleted
							? "italic text-muted-foreground/70"
							: "text-muted-foreground"
					)}
				>
					{comment.isDeleted ? "This comment was removed." : comment.body}
				</p>

				{!comment.isDeleted && (
					<div className="mt-2.5 flex items-center gap-4 pl-[2.375rem]">
						<button
							type="button"
							onClick={() => setReplying((v) => !v)}
							className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
						>
							<CornerDownRight className="size-3" />
							Reply
						</button>
						{comment.isMine && (
							<button
								type="button"
								onClick={onDelete}
								disabled={pending}
								className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-destructive disabled:opacity-50"
							>
								<Trash2 className="size-3" />
								Delete
							</button>
						)}
					</div>
				)}

				{replying && (
					<div className="mt-4 pl-[2.375rem]">
						<CommentForm
							slug={slug}
							parentId={comment.id}
							onDone={onChange}
							onCancel={() => setReplying(false)}
							autoFocus
							compact
						/>
					</div>
				)}
			</div>

			{comment.replies.length > 0 && (
				<ul className="pl-[2.375rem]">
					{comment.replies.map((child) => (
						<CommentItem
							key={child.id}
							comment={child}
							slug={slug}
							depth={depth + 1}
							onChange={onChange}
						/>
					))}
				</ul>
			)}
		</li>
	);
}

/* -------------------------------------------------------------------------- */

export function Comments({
	slug,
	initial,
}: {
	slug: string;
	initial: CommentNode[];
}) {
	const visitorId = useVisitorId();
	const [comments, setComments] = useState(initial);

	// The server render cannot know who you are, so `isMine` starts false for
	// everything. Once the visitor id is available, refetch so your own
	// comments show their delete control.
	useEffect(() => {
		if (!visitorId) return;
		let cancelled = false;
		loadComments(slug, visitorId).then((next) => {
			if (!cancelled) setComments(next);
		});
		return () => {
			cancelled = true;
		};
	}, [slug, visitorId]);

	const total = useMemo(() => countAll(comments), [comments]);

	return (
		<section id="comments" className="mt-20 border-t border-border pt-10">
			<h2 className="flex items-center gap-2.5 text-xl font-semibold tracking-tight">
				<MessageSquare className="size-5" />
				{total === 0
					? "Comments"
					: `${total} ${total === 1 ? "comment" : "comments"}`}
			</h2>
			<p className="mt-2 text-sm text-muted-foreground">
				No account needed. Pick a name and say what you think.
			</p>

			<div className="mt-6">
				<CommentForm slug={slug} parentId={null} onDone={setComments} />
			</div>

			{comments.length > 0 && (
				<ul className="mt-8 divide-y divide-border border-t border-border">
					{comments.map((comment) => (
						<CommentItem
							key={comment.id}
							comment={comment}
							slug={slug}
							depth={0}
							onChange={setComments}
						/>
					))}
				</ul>
			)}
		</section>
	);
}
