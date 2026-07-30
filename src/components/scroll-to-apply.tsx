"use client";

import { ArrowDown } from "lucide-react";

/**
 * Jumps to the form.
 *
 * A plain `#apply` anchor would work, but it changes the URL and pushes a
 * history entry, so Back takes you to the top of the same page instead of to
 * wherever you came from. Scrolling directly keeps history clean, and honours
 * the reader's motion preference rather than always animating.
 */
export function ScrollToApply() {
	function jump() {
		const target = document.getElementById("apply");
		if (!target) return;
		const reduced = window.matchMedia(
			"(prefers-reduced-motion: reduce)"
		).matches;
		target.scrollIntoView({
			behavior: reduced ? "auto" : "smooth",
			block: "start",
		});
		// Focus the first field once it is on screen, so keyboard users are not
		// left at the top of the document after the scroll.
		window.setTimeout(
			() => document.getElementById("ap-name")?.focus({ preventScroll: true }),
			reduced ? 0 : 600
		);
	}

	return (
		<button
			type="button"
			onClick={jump}
			className="group mt-7 inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background transition-opacity hover:opacity-85"
		>
			Apply to join
			<ArrowDown className="size-4 transition-transform duration-300 group-hover:translate-y-0.5" />
		</button>
	);
}
