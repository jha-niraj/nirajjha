"use client";

import { cn } from "@/lib/utils";

/**
 * The signature in the footer, with a chromatic-split glitch on hover.
 *
 * The effect is three stacked copies of the same text. The two `::before` and
 * `::after` layers are driven by CSS custom properties and stay perfectly still
 * until hover, so nothing moves for a reader who is only passing over the
 * footer on the way somewhere else.
 *
 * The layers are built with `content: attr(data-text)`, which means the string
 * lives in exactly one place. Duplicating it into markup would leave three
 * copies for a screen reader to read out; the pseudo-elements are `aria-hidden`
 * by construction, so only the real text node is announced.
 *
 * The site palette is strictly achromatic, so the offset copies are separated
 * by opacity and position rather than by the red and cyan a glitch effect
 * usually reaches for.
 */
export function Signature({ className }: { className?: string }) {
	return (
		<span
			data-text="Niraj Jha"
			className={cn("signature-glitch", className)}
		>
			Niraj Jha
		</span>
	);
}
