"use client";

import type { ChatMessage as Message } from "@/stores/ai-panel.store";
import { cn } from "@/lib/utils";
import { Quote } from "lucide-react";

/**
 * One turn in the thread.
 *
 * User turns are a right-aligned bubble, assistant turns are plain left-aligned
 * prose with no bubble. That asymmetry is deliberate: the assistant's answers
 * are the content, and wrapping them in a container makes long answers harder
 * to read than the article they are explaining.
 */
export function ChatMessage({ message }: { message: Message }) {
	if (message.role === "user") {
		return (
			<li className="flex flex-col items-end gap-1.5 px-4 py-2">
				{message.quote && (
					<blockquote className="max-w-[85%] rounded-lg border border-border bg-muted/60 px-3 py-2 text-left text-[13px] leading-relaxed text-muted-foreground">
						<Quote className="mb-1 size-3 opacity-60" />
						<span className="line-clamp-4">{message.quote}</span>
					</blockquote>
				)}
				<div className="max-w-[85%] rounded-2xl rounded-br-md bg-foreground px-3.5 py-2 text-sm leading-relaxed text-background">
					{message.content}
				</div>
			</li>
		);
	}

	return (
		<li className="px-4 py-2">
			<div className="text-sm leading-relaxed text-muted-foreground [&_strong]:font-semibold [&_strong]:text-foreground">
				{message.content}
			</div>
		</li>
	);
}

export function TypingIndicator() {
	return (
		<li className="px-4 py-2" aria-live="polite" aria-label="Thinking">
			<div className="flex items-center gap-1">
				{[0, 1, 2].map((i) => (
					<span
						key={i}
						className={cn(
							"size-1.5 rounded-full bg-muted-foreground/60",
							"animate-[chat-dot_1.2s_ease-in-out_infinite]"
						)}
						style={{ animationDelay: `${i * 160}ms` }}
					/>
				))}
			</div>
		</li>
	);
}
