"use client";

import { ChatMessage, TypingIndicator } from "@/components/ai/chat-message";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAIPanelStore } from "@/stores/ai-panel.store";
import { cn } from "@/lib/utils";
import {
	ArrowUp,
	Quote,
	RotateCcw,
	Sparkles,
	Square,
	X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

/**
 * Body of the docked reading assistant.
 *
 * Answers stream from /api/chat, which sends the whole post as context. Tokens
 * are appended to an assistant message that was created empty, so the reply
 * builds a word at a time instead of appearing all at once.
 *
 * The request is abortable and the send button becomes a stop button while a
 * reply is in flight, because the most common reason to stop is realising two
 * sentences in that you asked the wrong thing.
 */

const INTENTS = [
	{ label: "Explain simply", prompt: "Explain this simply." },
	{ label: "Why it matters", prompt: "Why does this matter?" },
	{ label: "Show an example", prompt: "Show me a concrete example." },
];

function IconButton({
	label,
	onClick,
	children,
}: {
	label: string;
	onClick: () => void;
	children: React.ReactNode;
}) {
	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<button
					type="button"
					onClick={onClick}
					aria-label={label}
					className="flex size-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
				>
					{children}
				</button>
			</TooltipTrigger>
			<TooltipContent side="bottom">{label}</TooltipContent>
		</Tooltip>
	);
}

export function AIPanel({
	slug,
	postTitle,
	isPost,
}: {
	slug: string;
	postTitle?: string;
	/** False on the index, the profile and /contribute. */
	isPost: boolean;
}) {
	const {
		messages,
		isStreaming,
		pendingQuote,
		setPendingQuote,
		addMessage,
		appendToMessage,
		replaceMessage,
		setStreaming,
		reset,
		close,
	} = useAIPanelStore();

	const [input, setInput] = useState("");
	const listEndRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLTextAreaElement>(null);
	const abortRef = useRef<AbortController | null>(null);

	useEffect(() => {
		listEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
	}, [messages.length, isStreaming]);

	// A pending quote means the reader just highlighted something and pressed
	// "Ask". Focus the composer so they can type straight away.
	useEffect(() => {
		if (pendingQuote) inputRef.current?.focus();
	}, [pendingQuote]);

	async function send(text: string) {
		const content = text.trim();
		if (!content || isStreaming) return;

		const quote = pendingQuote;
		// The history the model sees is the thread as it was *before* this turn.
		const history = useAIPanelStore
			.getState()
			.messages.map((m) => ({ role: m.role, content: m.content }));

		addMessage({ role: "user", content, quote: quote ?? undefined });
		setInput("");
		setPendingQuote(null);
		setStreaming(true);

		// The assistant message is created empty and filled as tokens arrive, so
		// the answer appears a word at a time rather than in one block.
		const replyId = addMessage({ role: "assistant", content: "" });

		const controller = new AbortController();
		abortRef.current = controller;

		try {
			const response = await fetch("/api/chat", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ slug, question: content, quote, history }),
				signal: controller.signal,
			});

			if (!response.ok || !response.body) {
				replaceMessage(
					replyId,
					(await response.text()) ||
						"Something went wrong reaching the assistant."
				);
				return;
			}

			const reader = response.body.getReader();
			const decoder = new TextDecoder();

			while (true) {
				const { done, value } = await reader.read();
				if (done) break;
				appendToMessage(replyId, decoder.decode(value, { stream: true }));
			}
		} catch (error) {
			if ((error as Error).name !== "AbortError") {
				replaceMessage(
					replyId,
					"The connection dropped before the answer finished."
				);
			}
		} finally {
			abortRef.current = null;
			setStreaming(false);
		}
	}

	function stop() {
		abortRef.current?.abort();
	}

	function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			void send(input);
		}
	}

	const empty = messages.length === 0;

	return (
		<div className="flex h-full flex-col bg-background">
			{/* Header */}
			<header className="flex shrink-0 items-center gap-2 border-b border-border px-3 py-2.5">
				<span
					aria-hidden
					className="flex size-6 shrink-0 items-center justify-center rounded-lg border border-border"
				>
					<Sparkles className="size-3.5" />
				</span>
				<div className="min-w-0 flex-1">
					<p className="truncate text-sm font-semibold text-foreground">
						{isPost ? "Ask about this post" : "Reading assistant"}
					</p>
					<p className="truncate text-xs text-muted-foreground">
						{postTitle ?? "Open a post to ask about it"}
					</p>
				</div>
				{!empty && (
					<IconButton label="New conversation" onClick={reset}>
						<RotateCcw className="size-3.5" />
					</IconButton>
				)}
				<IconButton label="Close panel" onClick={close}>
					<X className="size-3.5" />
				</IconButton>
			</header>

			{/* Thread */}
			<div className="min-h-0 flex-1">
				<ScrollArea className="h-full">
					{empty ? (
						<div className="flex h-full flex-col justify-center gap-5 px-5 py-10">
							<div>
								<p className="text-base font-semibold text-foreground">
									{isPost ? "Stuck on something?" : "Nothing to read yet"}
								</p>
								<p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
									{isPost
										? "Highlight any paragraph in the article and press Ask, or just type a question below."
										: "Open a post and I can answer questions about it, from the post itself."}
								</p>
							</div>
							<ul className="flex flex-col gap-2">
								{isPost &&
									INTENTS.map((intent) => (
									<li key={intent.label}>
										<button
											type="button"
											onClick={() => void send(intent.prompt)}
											className="w-full rounded-xl border border-border px-3.5 py-2.5 text-left text-sm font-medium text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
										>
											{intent.label}
										</button>
									</li>
									))}
							</ul>
						</div>
					) : (
						<ul className="py-3">
							{messages.map((message) => (
								<ChatMessage key={message.id} message={message} />
							))}
							{isStreaming &&
								messages[messages.length - 1]?.content === "" && (
									<TypingIndicator />
								)}
							<div ref={listEndRef} />
						</ul>
					)}
				</ScrollArea>
			</div>

			{/* Composer */}
			<div className="shrink-0 border-t border-border p-3">
				{pendingQuote && (
					<div className="mb-2 flex items-start gap-2 rounded-lg border border-border bg-muted/60 px-2.5 py-2">
						<Quote className="mt-0.5 size-3 shrink-0 text-muted-foreground" />
						<p className="line-clamp-2 flex-1 text-xs leading-relaxed text-muted-foreground">
							{pendingQuote}
						</p>
						<button
							type="button"
							onClick={() => setPendingQuote(null)}
							aria-label="Remove quoted passage"
							className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
						>
							<X className="size-3" />
						</button>
					</div>
				)}

				<div
					className={cn(
						"flex items-end gap-2 rounded-xl border border-border bg-card p-2",
						"transition-colors focus-within:border-foreground/40"
					)}
				>
					<textarea
						ref={inputRef}
						value={input}
						onChange={(e) => setInput(e.target.value)}
						onKeyDown={onKeyDown}
						disabled={!isPost}
						rows={1}
						placeholder={isPost ? "Ask a question" : "Open a post first"}
						aria-label="Ask a question about this post"
						className="max-h-32 min-h-[1.5rem] flex-1 resize-none bg-transparent text-sm leading-relaxed text-foreground outline-none ring-0 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 placeholder:text-muted-foreground"
					/>
					<Tooltip>
						<TooltipTrigger asChild>
							<button
								type="button"
								onClick={() => (isStreaming ? stop() : void send(input))}
								disabled={!isPost || (!isStreaming && !input.trim())}
								aria-label={isStreaming ? "Stop generating" : "Send"}
								className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-foreground text-background transition-opacity hover:opacity-85 disabled:opacity-30"
							>
								{isStreaming ? (
									<Square className="size-3 fill-current" />
								) : (
									<ArrowUp className="size-3.5" />
								)}
							</button>
						</TooltipTrigger>
						<TooltipContent side="top">
							{isStreaming ? "Stop" : "Send · Enter"}
						</TooltipContent>
					</Tooltip>
				</div>
			</div>
		</div>
	);
}
