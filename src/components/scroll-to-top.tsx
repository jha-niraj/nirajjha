"use client";

import { getScrollRoot } from "@/lib/scroll-root";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * Forces a new page to start at the very top.
 *
 * The App Router does scroll on navigation, but it will skip the scroll when it
 * decides the new segment is already "in view", and `scroll-behavior: smooth`
 * on `html` means anything that does run is animated and can be cut short by
 * the entrance animations changing the page height underneath it. Between the
 * two, a fresh page routinely settled forty or fifty pixels down, with the
 * heading half hidden behind the sticky header.
 *
 * This removes the guesswork: on forward navigation, jump to 0 with smooth
 * scrolling temporarily switched off so nothing can interrupt it.
 *
 * Two cases deliberately opt out:
 *
 * - **Back and forward.** A reader returning to the index expects to land where
 *   they left, not at the top. A `popstate` listener flags those.
 * - **Deep links to a heading.** `/post#some-section` has to honour the hash.
 */
export function ScrollToTop() {
	const pathname = usePathname();
	const cameFromHistory = useRef(false);

	useEffect(() => {
		const onPopState = () => {
			cameFromHistory.current = true;
		};
		window.addEventListener("popstate", onPopState);
		return () => window.removeEventListener("popstate", onPopState);
	}, []);

	useEffect(() => {
		if (cameFromHistory.current) {
			cameFromHistory.current = false;
			return;
		}
		if (window.location.hash) return;

		const root = getScrollRoot();
		if (!root) return;
		const previous = root.style.scrollBehavior;
		root.style.scrollBehavior = "auto";
		root.scrollTop = 0;
		root.style.scrollBehavior = previous;
	}, [pathname]);

	return null;
}
