/**
 * Turns `[lock](term:lock)` into a definable term.
 *
 * Definitions live once in frontmatter, so a term used in four places has one
 * source of truth and the prose stays readable:
 *
 *     ---
 *     terms:
 *       lock: "A claim a query takes before touching a table."
 *     ---
 *
 *     Before touching a table a query takes a [lock](term:lock).
 *
 * Link syntax rather than a custom `{{lock}}` marker because it is already
 * valid markdown: the display text can differ from the key, editors highlight
 * it, and nothing else in the toolchain has to learn a new token.
 *
 * The output is a `<span>` carrying the definition in a data attribute, which
 * `post-terms.tsx` upgrades into a real tooltip. Emitting a span rather than an
 * anchor matters: an anchor with a `term:` href is a broken link to a crawler
 * and to anyone without JavaScript, and it would show up in `pnpm links:check`
 * as an unresolvable scheme.
 *
 * A term with no matching definition degrades to plain text rather than
 * throwing, so a typo in a key costs a missing tooltip, not a failed build.
 */

type Node = {
	type: string;
	tagName?: string;
	properties?: Record<string, unknown>;
	value?: string;
	children?: Node[];
};

const PREFIX = "term:";

function textOf(node: Node): string {
	if (node.type === "text") return node.value ?? "";
	return (node.children ?? []).map(textOf).join("");
}

export default function rehypeTerms(options: {
	terms?: Record<string, string>;
}) {
	const terms = options.terms ?? {};

	return function transformer(tree: Node) {
		visit(tree);

		function visit(node: Node) {
			const children = node.children;
			if (!children) return;

			for (let i = 0; i < children.length; i++) {
				const child = children[i];

				if (child.tagName === "a") {
					const href = String(child.properties?.href ?? "");
					if (href.startsWith(PREFIX)) {
						const key = href.slice(PREFIX.length).trim();
						const definition = terms[key];
						const label = textOf(child);

						children[i] = definition
							? {
									type: "element",
									tagName: "span",
									properties: {
										className: ["term"],
										"data-term": key,
										"data-definition": definition,
									},
									children: [{ type: "text", value: label }],
								}
							: { type: "text", value: label };

						continue;
					}
				}

				visit(child);
			}
		}
	};
}
