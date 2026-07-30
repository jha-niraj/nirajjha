"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { getScrollRoot } from "@/lib/scroll-root";
import { useEffect, useState } from "react";

export type Heading = { id: string; text: string; level: 2 | 3 };

/**
 * Where a heading comes to rest, measured from the top of the scroller.
 *
 * The sticky header sits over the article, so scrolling a heading to 0 would
 * park it underneath. The observer's band starts at the same number on
 * purpose: a clicked heading has to land *inside* the band that decides which
 * item is lit, otherwise clicking one entry highlights its neighbour.
 */
const HEADER_OFFSET = 88;

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
			{
				// Without an explicit root the observer watches the viewport, and
				// the article no longer scrolls with the viewport.
				root: getScrollRoot(),
				rootMargin: `-${HEADER_OFFSET}px 0px -55% 0px`,
				threshold: 0,
			},
		);

		elements.forEach((el) => observer.observe(el));
		return () => observer.disconnect();
	}, [headings]);

	/**
	 * Scrolls the article to a heading.
	 *
	 * A bare `href="#id"` cannot do this. The shell is `h-screen
	 * overflow-hidden` with the ScrollArea viewport doing the scrolling, so the
	 * browser's native anchor jump moves that viewport in one frame with no
	 * animation, and `scroll-behavior: smooth` on `html` never applies because
	 * the document is not what scrolls.
	 *
	 * The offset is measured between the two elements' rects rather than read
	 * from `offsetTop`, which would be relative to the nearest positioned
	 * ancestor and is wrong as soon as anything in the article is `relative`.
	 */
	function scrollToHeading(e: React.MouseEvent<HTMLAnchorElement>, id: string) {
		// Let modified clicks (new tab, download) behave normally.
		if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) {
			return;
		}

		const root = getScrollRoot();
		const el = document.getElementById(id);
		if (!root || !el) return;

		e.preventDefault();

		const top =
			root.scrollTop +
			el.getBoundingClientRect().top -
			root.getBoundingClientRect().top -
			HEADER_OFFSET;

		const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
		root.scrollTo({ top, behavior: reduced ? "auto" : "smooth" });

		// Light it up immediately. The observer would get there on its own, but
		// only once the scroll finishes, which reads as a lag on the click.
		setActiveId(id);

		// Keep the URL shareable without letting the browser also jump.
		history.replaceState(null, "", `#${id}`);

		// Anchor navigation normally moves focus. Preserve that for keyboard and
		// screen reader users, without fighting the scroll we just started.
		el.setAttribute("tabindex", "-1");
		el.focus({ preventScroll: true });
	}

	if (headings.length < 2) return null;

	return (
		// Pins below the sticky header and never grows past the viewport, so a
		// post with thirty headings keeps the whole list reachable instead of
		// running off the bottom of the screen.
		//
		// Laid out as a flex column on purpose: the ScrollArea needs a *definite*
		// height for its viewport's `h-full` to resolve. With only `max-h` on the
		// nav the viewport would size to its content, overflow past the cap, and
		// get silently clipped by the Root's `overflow-hidden` with no scrollbar.
		// `flex-1 min-h-0` gives it a real height to work against.
		<nav
			aria-label="Table of contents"
			className="lg:sticky lg:top-24 lg:flex lg:max-h-[calc(100vh-7rem)] lg:flex-col"
		>
			<p className="mb-4 shrink-0 text-[12px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
				Contents
			</p>

			{/* Scrolls internally rather than with `overflow-y-auto`, which would
			    paint the platform scrollbar right down the middle of the layout. */}
			<ScrollArea className="lg:min-h-0 lg:flex-1 lg:pr-3">
				<ul className="space-y-0.5 border-l border-border">
					{headings.map((h) => {
						const active = h.id === activeId;
						return (
							<li key={h.id}>
								<a
									href={`#${h.id}`}
									onClick={(e) => scrollToHeading(e, h.id)}
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
