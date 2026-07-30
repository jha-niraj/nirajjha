"use client";

import { DiagramFigure } from "@/components/diagram-figure";
import { createRoot, type Root } from "react-dom/client";
import { useTheme } from "next-themes";
import { useEffect } from "react";

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

async function renderMermaid(
	root: ParentNode,
	isDark: boolean,
	roots: Root[]
) {
	const hosts = Array.from(
		root.querySelectorAll<HTMLElement>('[data-embed="mermaid"]')
	);
	if (hosts.length === 0) return;

	const { default: mermaid } = await import("mermaid");

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

	for (const [i, host] of hosts.entries()) {
		const source = host.querySelector(".mermaid-source")?.textContent?.trim();
		if (!source) continue;

		// Keep the source around. A re-render on theme change needs it, and by
		// then the host's contents have been replaced by an SVG.
		if (!host.dataset.source) host.dataset.source = source;

		try {
			const { svg } = await mermaid.render(
				`mermaid-${i}-${isDark ? "d" : "l"}`,
				host.dataset.source
			);
			// Handed to a React root rather than injected as innerHTML: the
			// viewport, its controls and the full-screen overlay are a component,
			// and mounting them this way is the only way to reach React from
			// inside an article that was itself injected as a string.
			host.replaceChildren();
			host.dataset.state = "ready";
			const root = createRoot(host);
			root.render(<DiagramFigure svg={svg} />);
			roots.push(root);
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

	useEffect(() => {
		const article = document.querySelector("article");
		if (!article) return;

		const unwire = wireYouTube(article);
		// One React root per diagram, unmounted alongside the diagram it renders.
		// Collected rather than queried back out of the DOM because the next
		// theme render replaces each host's contents entirely.
		const roots: Root[] = [];

		// Diagrams are redrawn on theme change: the SVG bakes in its colours, so
		// a light-mode diagram left alone would stay light on a dark page.
		void renderMermaid(article, resolvedTheme === "dark", roots);

		return () => {
			unwire();
			// Deferred: React refuses to unmount a root synchronously from inside
			// the render cycle that owns it, and logs a warning if you try.
			queueMicrotask(() => roots.forEach((r) => r.unmount()));
		};
	}, [resolvedTheme]);

	return null;
}
