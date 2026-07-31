"use client";

import { DiagramFigure } from "@/components/diagram-figure";
import { createRoot, type Root } from "react-dom/client";
import { useTheme } from "next-themes";
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

/** Reads a resolved CSS custom property so mermaid can match the site theme. */
function cssVar(name: string, fallback: string): string {
	if (typeof window === "undefined") return fallback;
	const value = getComputedStyle(document.documentElement)
		.getPropertyValue(name)
		.trim();
	return value ? `hsl(${value})` : fallback;
}

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
	isDark: boolean,
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

	const foreground = cssVar("--foreground", isDark ? "#f5f5f5" : "#0f0f0f");
	const background = cssVar("--background", isDark ? "#0a0a0a" : "#ffffff");
	const muted = cssVar("--muted", isDark ? "#1f1f1f" : "#f5f5f5");
	const border = cssVar("--border", isDark ? "#363636" : "#e3e3e3");

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
		const source = host.querySelector(".mermaid-source")?.textContent?.trim();
		if (!source) continue;

		// Keep the source around. A re-render on theme change needs it, and by
		// then the host's contents have been replaced by an SVG.
		if (!host.dataset.source) host.dataset.source = source;

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
	const { resolvedTheme } = useTheme();

	/**
	 * One React root per diagram host, surviving theme changes.
	 *
	 * This is a ref and not effect-local state because the two effects below
	 * have deliberately different lifetimes: roots are created and updated on
	 * every theme change, but torn down only when the component goes away.
	 */
	const rootsRef = useRef<Map<Element, Root>>(new Map());

	// Mount lifetime only. Tearing the roots down on every theme change was the
	// bug: unmount is async, so the next render reached the host before the old
	// root had let go of it.
	useEffect(() => {
		const article = document.querySelector("article");
		if (!article) return;

		const unwire = wireYouTube(article);
		const roots = rootsRef.current;

		return () => {
			unwire();
			// Deferred: React refuses to unmount a root synchronously from inside
			// the render cycle that owns it, and logs a warning if you try.
			queueMicrotask(() => {
				roots.forEach((root) => root.unmount());
				roots.clear();
			});
		};
	}, []);

	// Diagrams are redrawn on theme change: the SVG bakes in its colours, so a
	// light-mode diagram left alone would stay light on a dark page.
	useEffect(() => {
		const article = document.querySelector("article");
		if (!article) return;

		let stale = false;
		void renderMermaid(
			article,
			resolvedTheme === "dark",
			rootsRef.current,
			() => stale
		);

		// Marks the in-flight render stale rather than cancelling it, since the
		// dynamic import and mermaid.render cannot be aborted. It just stops the
		// result being applied after something newer has started.
		return () => {
			stale = true;
		};
	}, [resolvedTheme]);

	return null;
}
