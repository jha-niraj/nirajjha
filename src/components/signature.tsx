import { DATA } from "@/data/resume";
import { cn } from "@/lib/utils";

/**
 * The name, with a chromatic-split glitch on hover. Used twice: as the hero
 * heading and as the signature in the footer.
 *
 * The effect is three stacked copies of the same string. The `::before` and
 * `::after` layers sit perfectly still until hover, so nothing moves for
 * someone who is only passing over on the way somewhere else.
 *
 * Both layers are built with `content: attr(data-text)`, so the string lives in
 * exactly one place. Duplicating it into markup would leave three copies for a
 * screen reader to read out; pseudo-elements are never announced, so only the
 * real text node is.
 *
 * The palette is strictly achromatic, so the offset copies separate by position
 * and opacity rather than by the red and cyan fringing a glitch usually uses.
 *
 * No `"use client"`: this is pure CSS with no state or handlers, so it stays a
 * server component and ships no JavaScript.
 */
export function Signature({
	text = DATA.name,
	className,
}: {
	text?: string;
	className?: string;
}) {
	return (
		<span data-text={text} className={cn("signature-glitch", className)}>
			{text}
		</span>
	);
}
