"use client";

import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

type Term = {
	host: HTMLElement;
	label: string;
	definition: string;
};

/**
 * Upgrades the `<span class="term">` nodes that `rehype-terms` planted into
 * real Radix tooltips.
 *
 * The article is injected as an HTML string, so there is no React tree to hang
 * a component off. This collects the spans after paint and portals a tooltip
 * into each one, which is what lets them use the same shadcn Tooltip (and its
 * open/close animation) as the rest of the site rather than a CSS-only
 * imitation that would not handle focus, escape or collision.
 *
 * The trigger is a `<button>`, not a styled span: a definition has to be
 * reachable by keyboard, and Radix opens a tooltip on focus for free once the
 * trigger is focusable. The server-rendered span keeps the plain word, so
 * without JavaScript the sentence still reads correctly.
 */
export function PostTerms({ rootId }: { rootId: string }) {
	const [terms, setTerms] = useState<Term[]>([]);

	useEffect(() => {
		let collected: Term[] = [];

		// Deferred to the next frame rather than run inline. Emptying the spans
		// mutates the DOM the effect is reading, and doing that plus a setState
		// synchronously inside the effect forces a second render pass before the
		// browser has painted the article once.
		const handle = requestAnimationFrame(() => {
			const root = document.getElementById(rootId);
			if (!root) return;

			collected = Array.from(
				root.querySelectorAll<HTMLElement>("span.term[data-definition]")
			).map((host) => {
				const label = host.textContent ?? "";
				const definition = host.dataset.definition ?? "";
				// Emptied so the portal is the only thing rendering the word;
				// leaving the text would render it twice.
				host.textContent = "";
				return { host, label, definition };
			});

			setTerms(collected);
		});

		return () => {
			cancelAnimationFrame(handle);
			const found = collected;
			// Put the plain word back, so a re-render or a route change does not
			// leave an empty span behind.
			found.forEach(({ host, label }) => {
				host.textContent = label;
			});
		};
	}, [rootId]);

	return (
		<>
			{terms.map(({ host, label, definition }, i) =>
				createPortal(
					<Tooltip key={i}>
						<TooltipTrigger asChild>
							<button type="button" className="term-trigger">
								{label}
							</button>
						</TooltipTrigger>
						<TooltipContent
							side="top"
							align="center"
							className="max-w-xs text-pretty text-[13px] font-normal leading-relaxed"
						>
							{definition}
						</TooltipContent>
					</Tooltip>,
					host
				)
			)}
		</>
	);
}
