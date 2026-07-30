"use client";

import { DATA } from "@/data/resume";
import { cn } from "@/lib/utils";
import { useEffect, useRef } from "react";

/**
 * The footer wordmark: the name at full bleed, distorting locally under the
 * cursor.
 *
 * The previous version threw every letter apart on hover, which read as the
 * name breaking rather than reacting. This keeps the word where it is and only
 * disturbs what the cursor is actually over: each character is displaced,
 * scaled and blurred in proportion to how close the pointer is, so the effect
 * is a bulge that travels with the mouse and settles the moment it leaves.
 *
 * Set in the display serif rather than the UI grotesque, upright, so it reads
 * as a masthead instead of a signature.
 *
 * Per-character spans mean a screen reader would announce "N, i, r, a, j", so
 * the real name sits once in an `sr-only` span and every animated piece is
 * `aria-hidden`.
 */

const RADIUS = 130;
const LIFT = 20;
const SPREAD = 12;

export function Signature({
	text = DATA.shortName,
	className,
}: {
	text?: string;
	className?: string;
}) {
	const hostRef = useRef<HTMLSpanElement>(null);
	const frame = useRef(0);
	const chars = Array.from(text);

	useEffect(() => {
		const host = hostRef.current;
		if (!host) return;

		// Motion is the whole point of this element, so it is skipped entirely
		// rather than reduced when the reader has asked for less.
		if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

		const letters = Array.from(
			host.querySelectorAll<HTMLElement>(".wordmark-char")
		);
		if (letters.length === 0) return;

		// Measured once per pointer entry rather than per move: getBoundingClientRect
		// on every character on every mousemove is a forced layout per frame.
		let centres: number[] = [];
		let hostTop = 0;
		let hostHeight = 0;

		function measure() {
			const hostRect = host!.getBoundingClientRect();
			hostTop = hostRect.top;
			hostHeight = hostRect.height;
			centres = letters.map((el) => {
				const r = el.getBoundingClientRect();
				return r.left + r.width / 2;
			});
		}

		function paint(clientX: number, clientY: number) {
			// Vertical falloff too, so passing well above or below the wordmark
			// does not bulge it from a distance.
			const dy = Math.max(
				0,
				Math.abs(clientY - (hostTop + hostHeight / 2)) - hostHeight / 2
			);

			letters.forEach((el, i) => {
				const dx = clientX - centres[i];
				const distance = Math.hypot(dx, dy);
				// 1 directly under the cursor, 0 at the edge of the radius.
				const strength = Math.max(0, 1 - distance / RADIUS);
				const eased = strength * strength;

				el.style.setProperty("--w-lift", `${-eased * LIFT}px`);
				el.style.setProperty(
					"--w-push",
					`${Math.sign(dx || 1) * -eased * SPREAD}px`
				);
				el.style.setProperty("--w-scale", `${1 + eased * 0.18}`);
				el.style.setProperty("--w-blur", `${eased * 1.4}px`);
				el.style.setProperty("--w-ink", `${0.16 + eased * 0.5}`);
			});
		}

		function onMove(e: PointerEvent) {
			cancelAnimationFrame(frame.current);
			frame.current = requestAnimationFrame(() => paint(e.clientX, e.clientY));
		}

		function onEnter() {
			measure();
		}

		function onLeave() {
			cancelAnimationFrame(frame.current);
			letters.forEach((el) => {
				el.style.setProperty("--w-lift", "0px");
				el.style.setProperty("--w-push", "0px");
				el.style.setProperty("--w-scale", "1");
				el.style.setProperty("--w-blur", "0px");
				el.style.setProperty("--w-ink", "0.16");
			});
		}

		host.addEventListener("pointerenter", onEnter);
		host.addEventListener("pointermove", onMove);
		host.addEventListener("pointerleave", onLeave);
		window.addEventListener("resize", measure);

		return () => {
			cancelAnimationFrame(frame.current);
			host.removeEventListener("pointerenter", onEnter);
			host.removeEventListener("pointermove", onMove);
			host.removeEventListener("pointerleave", onLeave);
			window.removeEventListener("resize", measure);
		};
	}, [text]);

	return (
		<span ref={hostRef} className={cn("wordmark", className)}>
			<span className="sr-only">{text}</span>
			<span aria-hidden className="wordmark-chars">
				{chars.map((char, i) => (
					<span key={i} className="wordmark-char">
						{char === " " ? " " : char}
					</span>
				))}
			</span>
		</span>
	);
}
