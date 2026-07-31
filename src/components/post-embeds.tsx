"use client";

import { DiagramFigure } from "@/components/diagram-figure";
import { createRoot, type Root } from "react-dom/client";
import { useEffect, useRef } from "react";

/**
 * Upgrades the embeds that `rehype-embeds` planted in the article HTML.
 *
 * Renders nothing itself. The article is injected with dangerouslySetInnerHTML,
 * so there are no React nodes to hang behaviour off; this walks the DOM once
 * after paint and wires up what it finds.
 *
 * Cost control is the whole point of the split:
 *
 * - YouTube ships as a thumbnail and a button. The real iframe, which is over a
 *   megabyte across dozens of requests, is only created when someone actually
 *   presses play. Three videos in a post cost three images until then.
 * - mermaid is a large library, so it is imported dynamically and only when a
 *   diagram is present. A post without one never downloads a byte of it.
 */

/**
 * Placeholder colours, and they are meant to be overridden.
 *
 * mermaid bakes its palette into a <style> block inside the SVG, which is why
 * this used to re-render the whole diagram on every theme change. That coupled
 * the diagram's colours to *when* JavaScript ran, and it was wrong in both
 * directions: light values on a dark page, then dark values on a light one.
 *
 * The colours now come from CSS instead, in the "Diagram theming" block in
 * globals.css, which keys off the same `.dark` class as the rest of the site.
 * A theme flip is a repaint, not a re-render, so there is nothing left to race.
 * These values only decide what a diagram looks like in the instant before that
 * stylesheet applies. They are the dark tokens, matching the frame, so even that
 * instant is correct.
 */
const PLACEHOLDER = {
	foreground: "hsl(0 0% 96%)",
	background: "hsl(0 0% 4%)",
	muted: "hsl(0 0% 12%)",
	border: "hsl(0 0% 21%)",
} as const;

function wireYouTube(root: ParentNode): () => void {
	const triggers = Array.from(
		root.querySelectorAll<HTMLButtonElement>(".embed-yt-trigger")
	);

	const cleanups = triggers.map((trigger) => {
		function play() {
			const id = trigger.dataset.ytId;
			const frame = trigger.closest<HTMLElement>(".embed-frame");
			if (!id || !frame) return;

			const iframe = document.createElement("iframe");
			// autoplay because the click *was* the play action. Anything else
			// makes the reader press play twice.
			iframe.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`;
			iframe.title = trigger.getAttribute("aria-label") ?? "YouTube video";
			iframe.allow =
				"accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
			iframe.allowFullscreen = true;
			iframe.loading = "lazy";
			iframe.className = "embed-yt-iframe";

			frame.replaceChildren(iframe);
		}

		trigger.addEventListener("click", play);
		return () => trigger.removeEventListener("click", play);
	});

	return () => cleanups.forEach((fn) => fn());
}

/**
 * Monotonic, so two renders can never ask mermaid for the same element id.
 *
 * mermaid writes the id into the SVG and references it from `url(#id)` fills.
 * Two diagrams sharing an id means the second one's references resolve against
 * the first, which renders as a blank box.
 */
let diagramSeq = 0;

async function renderMermaid(
	root: ParentNode,
	roots: Map<Element, Root>,
	isStale: () => boolean
) {
	const hosts = Array.from(
		root.querySelectorAll<HTMLElement>('[data-embed="mermaid"]')
	);
	if (hosts.length === 0) return;

	const { default: mermaid } = await import("mermaid");
	// The import is slow enough that a theme flip or a navigation can land
	// mid-flight. Anything after an await has to re-check.
	if (isStale()) return;

	const { foreground, background, muted, border } = PLACEHOLDER;

	// Every colour is pulled from the site's own tokens, which are all zero
	// saturation. mermaid's stock palettes are heavily coloured and would be the
	// only hue anywhere on the site.
	mermaid.initialize({
		startOnLoad: false,
		securityLevel: "strict",
		theme: "base",
		fontFamily: "var(--font-sans), ui-sans-serif, system-ui, sans-serif",
		// useMaxWidth off on purpose. Left on, mermaid stamps `max-width` on the
		// SVG and it scales down to whatever column it lands in, taking its
		// labels with it. Natural size plus a scrolling host keeps text legible.
		flowchart: { useMaxWidth: false, nodeSpacing: 44, rankSpacing: 58, padding: 14 },
		sequence: { useMaxWidth: false },
		themeVariables: {
			fontSize: "15px",
			background,
			primaryColor: muted,
			primaryTextColor: foreground,
			primaryBorderColor: border,
			secondaryColor: muted,
			secondaryTextColor: foreground,
			secondaryBorderColor: border,
			tertiaryColor: background,
			tertiaryTextColor: foreground,
			tertiaryBorderColor: border,
			lineColor: foreground,
			textColor: foreground,
			mainBkg: muted,
			nodeBorder: border,
			clusterBkg: background,
			clusterBorder: border,
			edgeLabelBackground: background,
			titleColor: foreground,
			actorBkg: muted,
			actorBorder: border,
			actorTextColor: foreground,
			signalColor: foreground,
			signalTextColor: foreground,
			labelBoxBkgColor: muted,
			labelBoxBorderColor: border,
			labelTextColor: foreground,
			noteBkgColor: muted,
			noteBorderColor: border,
			noteTextColor: foreground,
		},
	});

	for (const host of hosts) {
		/*
		 * The cached copy first, the DOM only as a fallback.
		 *
		 * This was the theme bug. The first render calls `host.replaceChildren()`,
		 * which deletes the `.mermaid-source` element the source was read from. So
		 * on every later run the query returned nothing, the `continue` below
		 * fired, and the host was skipped: the diagram kept whatever colours it
		 * was first drawn with. Load in light and switch to dark and you got a
		 * white diagram with black labels on a black page; load in dark and switch
		 * to light and you got the exact inverse. `dataset.source` was already
		 * being written for precisely this, and then never read.
		 */
		const source =
			host.dataset.source ??
			host.querySelector(".mermaid-source")?.textContent?.trim();
		if (!source) continue;
		host.dataset.source = source;

		try {
			const { svg } = await mermaid.render(
				`mermaid-${diagramSeq++}`,
				host.dataset.source
			);
			if (isStale()) return;

			// Handed to a React root rather than injected as innerHTML: the
			// viewport, its controls and the full-screen overlay are a component,
			// and mounting them this way is the only way to reach React from
			// inside an article that was itself injected as a string.
			//
			// One root per host, kept in the map and reused. Calling createRoot on
			// a container that already has one is a React error, and it happened
			// on every theme flip and on every Fast Refresh: the old code made a
			// second root for the same element and orphaned the first.
			const existing = roots.get(host);
			if (existing) {
				existing.render(<DiagramFigure svg={svg} />);
			} else {
				// Only safe before the first root exists. Afterwards the children
				// belong to React, and clearing them behind its back desyncs it.
				host.replaceChildren();
				const created = createRoot(host);
				roots.set(host, created);
				created.render(<DiagramFigure svg={svg} />);
			}
			host.dataset.state = "ready";
		} catch (error) {
			// A malformed diagram must not take the article down with it. Leave
			// the source visible, which is the most useful thing to show anyone
			// who has to fix it.
			console.warn("[mermaid] could not render diagram:", error);
			host.dataset.state = "error";
		}
	}
}

export function PostEmbeds() {
	/**
	 * One React root per diagram host, surviving theme changes.
	 *
	 * This is a ref and not effect-local state because the two effects below
	 * have deliberately different lifetimes: roots are created and updated on
	 * every theme change, but torn down only when the component goes away.
	 */
	const rootsRef = useRef<Map<Element, Root>>(new Map());

	// One pass, on mount. Diagrams are no longer re-rendered on theme change:
	// their colours come from CSS now, so a flip is a repaint.
	useEffect(() => {
		const article = document.querySelector("article");
		if (!article) return;

		const unwire = wireYouTube(article);
		const roots = rootsRef.current;
		let stale = false;

		void renderMermaid(article, roots, () => stale);

		return () => {
			// Marks the in-flight render stale rather than cancelling it, since the
			// dynamic import and mermaid.render cannot be aborted. It just stops
			// the result being applied after the article has gone.
			stale = true;
			unwire();
			// Deferred: React refuses to unmount a root synchronously from inside
			// the render cycle that owns it, and logs a warning if you try.
			queueMicrotask(() => {
				roots.forEach((root) => root.unmount());
				roots.clear();
			});
		};
	}, []);

	return null;
}
