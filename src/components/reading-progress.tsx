"use client";

import { getScrollRoot } from "@/lib/scroll-root";
import { useEffect, useRef, useState } from "react";

/**
 * Progress through the article, pinned to the bottom edge of the sticky header.
 *
 * Scoped to the article element rather than the document on purpose. Document
 * scroll counts the header, the comment thread, the "keep reading" cards and
 * the footer, so it reads 60% when you have actually finished the prose. This
 * measures the distance between the top of the article and its end, which is
 * the thing a reader is tracking.
 */
export function ReadingProgress({ targetId }: { targetId: string }) {
	const [progress, setProgress] = useState(0);
	const frame = useRef(0);

	useEffect(() => {
		const root = getScrollRoot();
		const article = document.getElementById(targetId);
		if (!root || !article) return;

		function measure() {
			const scroller = getScrollRoot();
			const el = document.getElementById(targetId);
			if (!scroller || !el) return;

			// Offsets are measured against the scroller's own box, so this works
			// whether the shell or the document is the thing moving.
			const scrollTop = scroller.scrollTop;
			const start =
				el.getBoundingClientRect().top -
				scroller.getBoundingClientRect().top +
				scrollTop;
			const viewport = scroller.clientHeight;
			// The article is "finished" when its last line clears the bottom of
			// the viewport, not when its top reaches the top.
			const distance = el.offsetHeight - viewport;

			if (distance <= 0) {
				setProgress(scrollTop > start ? 1 : 0);
				return;
			}

			setProgress(Math.min(1, Math.max(0, (scrollTop - start) / distance)));
		}

		function onScroll() {
			cancelAnimationFrame(frame.current);
			frame.current = requestAnimationFrame(measure);
		}

		measure();
		root.addEventListener("scroll", onScroll, { passive: true });
		window.addEventListener("resize", onScroll);

		return () => {
			cancelAnimationFrame(frame.current);
			root.removeEventListener("scroll", onScroll);
			window.removeEventListener("resize", onScroll);
		};
	}, [targetId]);

	return (
		<div
			// Inset to the content surface rather than the viewport: the page is
			// a rounded pane now, and a bar running edge to edge started outside
			// its left boundary and continued underneath the docked panel.
			className="pointer-events-none fixed left-2 top-[4.5rem] z-50 h-0.5 rounded-full sm:left-3 lg:right-[calc(var(--ai-panel-inset,0.5rem)+0.5rem)] right-2 sm:right-3"
			role="progressbar"
			aria-label="Reading progress"
			aria-valuemin={0}
			aria-valuemax={100}
			aria-valuenow={Math.round(progress * 100)}
		>
			<div
				className="h-full origin-left rounded-full bg-foreground transition-[transform] duration-150 ease-out"
				style={{ transform: `scaleX(${progress})` }}
			/>
		</div>
	);
}
