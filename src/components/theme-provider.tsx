"use client";

import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes";
// next-themes 0.4 stopped shipping `next-themes/dist/types`. The props type is
// exported from the package root now.
import type { ThemeProviderProps } from "next-themes";
import { flushSync } from "react-dom";

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
	return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}

/** The click that started the switch. Its presence picks wipe over cross-fade. */
export type ThemeTransitionOrigin = { x: number; y: number };

type DocumentWithViewTransition = Document & {
	startViewTransition?: (callback: () => void) => {
		ready: Promise<void>;
		finished: Promise<void>;
	};
};

/**
 * Animates a theme change with the View Transitions API: a directional wipe of
 * the new theme, left to right going dark, right to left coming back.
 *
 * The provider runs with `disableTransitionOnChange`, which strips CSS
 * transitions at the moment of the switch so the page does not slow-fade on
 * load. That also means a plain `transition: background 0.3s` can never animate
 * a theme change, and a View Transition is the only thing left that can.
 *
 * The clip is bound as a CSS keyframe rather than applied with `.animate()`
 * after `ready`. Awaiting `ready` leaves one unclipped frame in which the new
 * theme paints full screen before the clip snaps back, which reads as a flash.
 *
 * Browsers without the API, and anyone who asked for reduced motion, get the
 * switch with no animation.
 */
export function startThemeTransition(
	apply: () => void,
	origin?: ThemeTransitionOrigin
): void {
	const doc =
		typeof document !== "undefined"
			? (document as DocumentWithViewTransition)
			: undefined;

	const prefersReduced =
		typeof window !== "undefined" &&
		typeof window.matchMedia === "function" &&
		window.matchMedia("(prefers-reduced-motion: reduce)").matches;

	if (!doc?.startViewTransition || prefersReduced) {
		apply();
		return;
	}

	const root = document.documentElement;

	if (origin) {
		// Direction follows the theme being switched TO. `attribute="class"` puts
		// `dark` on <html>, so its absence right now means this click turns dark on.
		const goingToDark = !root.classList.contains("dark");
		// inset(top right bottom left): the far edge starts collapsed at 100%.
		root.style.setProperty(
			"--vt-clip-from",
			goingToDark ? "inset(0 100% 0 0)" : "inset(0 0 0 100%)"
		);
	}

	root.dataset.themeTransition = origin ? "reveal" : "fade";

	// flushSync is mandatory. React batches by default, so without it the class
	// lands after the browser has already taken its "after" snapshot and nothing
	// animates.
	const transition = doc.startViewTransition(() => flushSync(apply));

	transition.finished
		.catch(() => {
			// A rapid re-toggle supersedes the running transition, which rejects.
		})
		.finally(() => {
			delete root.dataset.themeTransition;
			root.style.removeProperty("--vt-clip-from");
		});
}

export { useTheme };
