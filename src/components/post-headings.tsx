"use client";

import { useEffect } from "react";

/**
 * Adds a copy-link control to every heading in the article.
 *
 * Renders nothing. The article arrives as an HTML string, so like
 * `post-embeds.tsx` this walks the DOM once after paint and wires up what it
 * finds.
 *
 * Why copy rather than a plain anchor: an anchor navigates, which scrolls the
 * reader away from the paragraph they were about to quote. Copying leaves them
 * where they are with the URL on the clipboard, which is the thing they
 * actually wanted.
 */
export function PostHeadings({ rootId }: { rootId: string }) {
	useEffect(() => {
		const root = document.getElementById(rootId);
		if (!root) return;

		const headings = Array.from(
			root.querySelectorAll<HTMLElement>("h2[id], h3[id]")
		);

		const cleanups = headings.map((heading) => {
			// rehype-autolink-headings already wraps the text in an anchor. The
			// button goes beside it, so the heading text itself stays plain.
			const button = document.createElement("button");
			button.type = "button";
			button.className = "heading-copy";
			button.setAttribute("aria-label", `Copy link to "${heading.textContent?.trim() ?? ""}"`);
			button.innerHTML = LINK_ICON;

			let resetTimer: ReturnType<typeof setTimeout> | undefined;

			async function copy() {
				const url = `${window.location.origin}${window.location.pathname}#${heading.id}`;
				try {
					await navigator.clipboard.writeText(url);
				} catch {
					// Clipboard is permission gated and unavailable on insecure
					// origins. Falling back to the URL bar is better than silence.
					window.location.hash = heading.id;
					return;
				}

				button.dataset.copied = "true";
				button.innerHTML = CHECK_ICON;
				clearTimeout(resetTimer);
				resetTimer = setTimeout(() => {
					delete button.dataset.copied;
					button.innerHTML = LINK_ICON;
				}, 1600);
			}

			button.addEventListener("click", copy);
			heading.appendChild(button);

			return () => {
				clearTimeout(resetTimer);
				button.removeEventListener("click", copy);
				button.remove();
			};
		});

		return () => cleanups.forEach((fn) => fn());
	}, [rootId]);

	return null;
}

const LINK_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`;

const CHECK_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>`;
