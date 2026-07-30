"use client";

/**
 * The element that actually scrolls.
 *
 * The shell is `h-screen overflow-hidden` with a Radix ScrollArea inside, so
 * the document never scrolls: `window.scrollY` is permanently 0 and
 * `window.addEventListener("scroll")` never fires. Anything that used to rely
 * on either has to go through here instead.
 *
 * Falls back to the document scrolling element, so a component still works if
 * it is ever rendered outside the shell.
 */
export function getScrollRoot(): HTMLElement | null {
	if (typeof document === "undefined") return null;
	return (
		document.querySelector<HTMLElement>("[data-scroll-root]") ??
		(document.scrollingElement as HTMLElement | null)
	);
}

/** Current scroll offset of whichever element is doing the scrolling. */
export function getScrollTop(): number {
	return getScrollRoot()?.scrollTop ?? 0;
}
