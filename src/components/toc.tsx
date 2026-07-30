"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

export type Heading = { id: string; text: string; level: 2 | 3 };

/**
 * Sticky contents rail. Highlights the section you are currently reading by
 * watching the headings themselves rather than doing scroll maths, so it stays
 * correct regardless of section length or images loading late.
 */
export function TableOfContents({ headings }: { headings: Heading[] }) {
	const [activeId, setActiveId] = useState<string>(headings[0]?.id ?? "");

	useEffect(() => {
		if (headings.length === 0) return;

		const elements = headings
			.map((h) => document.getElementById(h.id))
			.filter((el): el is HTMLElement => el !== null);

		if (elements.length === 0) return;

		const observer = new IntersectionObserver(
			(entries) => {
				// Several headings can be inside the band at once. Take the one
				// nearest the top of the viewport, which is what the reader is
				// actually looking at.
				const visible = entries
					.filter((e) => e.isIntersecting)
					.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

				if (visible[0]) {
					setActiveId(visible[0].target.id);
					return;
				}

				// Nothing in the band (a long section between two headings):
				// keep the last heading that has scrolled past the top.
				const above = elements.filter(
					(el) => el.getBoundingClientRect().top < 120,
				);
				if (above.length) setActiveId(above[above.length - 1].id);
			},
			// Band running from just under the sticky header to the middle of
			// the screen.
			{ rootMargin: "-88px 0px -55% 0px", threshold: 0 },
		);

		elements.forEach((el) => observer.observe(el));
		return () => observer.disconnect();
	}, [headings]);

	if (headings.length < 2) return null;

	return (
		// The rail pins itself below the sticky header and never grows past the
		// viewport, so a post with thirty headings still leaves the list reachable
		// instead of running off the bottom of the screen.
		<nav
			aria-label="Table of contents"
			className="lg:sticky lg:top-24 lg:max-h-[calc(100vh-8rem)]"
		>
			<p className="mb-4 text-[12px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
				Contents
			</p>

			{/* Scrolls internally rather than with `overflow-y-auto`, which would
			    paint the platform scrollbar right down the middle of the layout. */}
			<ScrollArea className="lg:max-h-[calc(100vh-12rem)] lg:pr-3">
				<ul className="space-y-0.5 border-l border-border">
					{headings.map((h) => {
						const active = h.id === activeId;
						return (
							<li key={h.id}>
								<a
									href={`#${h.id}`}
									aria-current={active ? "location" : undefined}
									className={cn(
										"-ml-px block border-l-2 py-1.5 text-base leading-snug transition-colors",
										h.level === 3 ? "pl-6" : "pl-4",
										active
											? "border-foreground font-semibold text-foreground"
											: "border-transparent font-medium text-muted-foreground hover:border-border hover:text-foreground",
									)}
								>
									{h.text}
								</a>
							</li>
						);
					})}
				</ul>
			</ScrollArea>
		</nav>
	);
}
