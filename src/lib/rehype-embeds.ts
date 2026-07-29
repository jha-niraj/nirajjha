/**
 * Turns ordinary markdown into rich embeds, with no MDX and no JSX in posts.
 *
 * Two rules, both driven by what you would write anyway:
 *
 *   1. A paragraph containing nothing but a YouTube link becomes a player.
 *      Link text, if it differs from the URL, becomes the caption.
 *
 *          [How Postgres indexes work](https://youtu.be/dQw4w9WgXcQ)
 *
 *   2. A fenced block tagged `mermaid` becomes a diagram.
 *
 *          ```mermaid
 *          graph TD; A-->B;
 *          ```
 *
 * This is a rehype plugin rather than a remark one so it can emit real element
 * nodes instead of raw HTML strings, which would need `allowDangerousHtml` on
 * both remark-rehype and rehype-stringify and would reopen an injection hole
 * that is currently closed.
 *
 * Ordering matters: it has to run before rehype-pretty-code, or shiki will have
 * already syntax-highlighted the mermaid source into spans that are no longer
 * readable as diagram text.
 *
 * Neither embed ships markup that needs JavaScript to be understood. The video
 * is a thumbnail and a link until clicked, and the diagram falls back to its
 * own source, which is legible. `post-embeds.tsx` upgrades both on the client.
 */

type Node = {
	type: string;
	tagName?: string;
	properties?: Record<string, unknown>;
	value?: string;
	children?: Node[];
};

/** Matches the three URL shapes YouTube hands out, and nothing else. */
const YOUTUBE =
	/^https?:\/\/(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/;

function youtubeId(url: string): string | null {
	const match = YOUTUBE.exec(url.trim());
	return match ? match[1] : null;
}

function el(
	tagName: string,
	properties: Record<string, unknown>,
	children: Node[] = []
): Node {
	return { type: "element", tagName, properties, children };
}

function text(value: string): Node {
	return { type: "text", value };
}

/** Flattens an element's text, so link labels can be compared to their href. */
function textOf(node: Node): string {
	if (node.type === "text") return node.value ?? "";
	return (node.children ?? []).map(textOf).join("");
}

/** Whitespace-only text nodes are noise when checking "is this alone here?". */
function meaningful(children: Node[]): Node[] {
	return children.filter(
		(c) => !(c.type === "text" && !(c.value ?? "").trim())
	);
}

function youtubeEmbed(id: string, caption: string | null): Node {
	// The play control is a real <button>, so it is keyboard reachable and
	// announced correctly before any JavaScript has run.
	const button = el(
		"button",
		{
			type: "button",
			className: ["embed-yt-trigger"],
			"data-yt-id": id,
			"aria-label": caption ? `Play video: ${caption}` : "Play video",
		},
		[
			el("img", {
				// hqdefault exists for every video. maxresdefault does not, and
				// 404s to a grey placeholder on older uploads.
				src: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
				alt: "",
				loading: "lazy",
				decoding: "async",
				className: ["embed-yt-thumb"],
			}),
			el("span", { className: ["embed-yt-play"], "aria-hidden": "true" }, [
				el(
					"svg",
					{
						viewBox: "0 0 24 24",
						width: 26,
						height: 26,
						fill: "currentColor",
						"aria-hidden": "true",
					},
					[el("path", { d: "M8 5v14l11-7z" })]
				),
			]),
		]
	);

	const children: Node[] = [
		el("div", { className: ["embed-frame"], "data-embed": "youtube" }, [
			button,
			// Present for anyone without JavaScript, hidden once the facade is
			// live. A dead embed is worse than a plain link.
			el("noscript", {}, [
				el(
					"a",
					{
						href: `https://www.youtube.com/watch?v=${id}`,
						target: "_blank",
						rel: "noopener noreferrer",
					},
					[text("Watch on YouTube")]
				),
			]),
		]),
	];

	if (caption) {
		children.push(el("figcaption", { className: ["embed-caption"] }, [
			text(caption),
		]));
	}

	return el("figure", { className: ["embed", "embed-youtube"] }, children);
}

function mermaidEmbed(source: string): Node {
	return el("figure", { className: ["embed", "embed-mermaid"] }, [
		el(
			"div",
			{
				className: ["mermaid-host"],
				"data-embed": "mermaid",
				// Reserves a sensible box so the article does not jump when the
				// diagram finishes rendering.
				"data-state": "pending",
			},
			[
				// The source doubles as the no-JavaScript fallback and as the input
				// the client reads back out. Keeping it as text content rather than
				// an attribute avoids a second layer of escaping.
				el("pre", { className: ["mermaid-source"] }, [text(source)]),
			]
		),
	]);
}

export default function rehypeEmbeds() {
	return (tree: Node) => {
		walk(tree);
	};

	function walk(node: Node) {
		const children = node.children;
		if (!children) return;

		for (let i = 0; i < children.length; i++) {
			const child = children[i];
			const replacement = convert(child);
			if (replacement) {
				children[i] = replacement;
				continue;
			}
			walk(child);
		}
	}

	function convert(node: Node): Node | null {
		if (node.type !== "element") return null;

		// Rule 1: a paragraph that is only a YouTube link.
		if (node.tagName === "p") {
			const inner = meaningful(node.children ?? []);
			if (inner.length !== 1) return null;

			const only = inner[0];
			if (only.type !== "element" || only.tagName !== "a") return null;

			const href = String(only.properties?.href ?? "");
			const id = youtubeId(href);
			if (!id) return null;

			const label = textOf(only).trim();
			// A bare pasted URL is not a caption.
			const caption = label && label !== href ? label : null;

			return youtubeEmbed(id, caption);
		}

		// Rule 2: a ```mermaid fence. remark-rehype renders it as pre > code with
		// a language class.
		if (node.tagName === "pre") {
			const inner = meaningful(node.children ?? []);
			const code = inner[0];
			if (!code || code.type !== "element" || code.tagName !== "code") {
				return null;
			}

			const classes = code.properties?.className;
			const list = Array.isArray(classes) ? classes.map(String) : [];
			if (!list.includes("language-mermaid")) return null;

			const source = textOf(code).trim();
			if (!source) return null;

			return mermaidEmbed(source);
		}

		return null;
	}
}
