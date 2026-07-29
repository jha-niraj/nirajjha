"use client";

import { startThemeTransition, useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";
import { useIsHydrated } from "@/lib/visitor";
import { Moon, Sun } from "lucide-react";

/**
 * Theme toggle.
 *
 * Both icons are always in the DOM and cross-faded rather than swapped. During
 * SSR `resolvedTheme` is undefined, so picking one to render would paint the
 * wrong icon and visibly flip on hydration; painting both and animating opacity
 * means the first frame is simply neutral.
 *
 * The click coordinates go to `startThemeTransition`, which uses their presence
 * to pick the directional wipe over a plain cross-fade.
 */
export function ModeToggle() {
	const { resolvedTheme, setTheme } = useTheme();
	// useSyncExternalStore rather than "useState plus an effect that sets it":
	// hydration is an external fact, and the effect form costs an extra render
	// pass on every mount.
	const mounted = useIsHydrated();

	const isDark = mounted && resolvedTheme === "dark";

	return (
		<button
			type="button"
			onClick={(e) =>
				startThemeTransition(() => setTheme(isDark ? "light" : "dark"), {
					x: e.clientX,
					y: e.clientY,
				})
			}
			aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
			className="relative inline-flex size-9 items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40"
		>
			<Sun
				aria-hidden
				className={cn(
					"absolute size-[1.05rem] transition-all duration-300",
					mounted && !isDark
						? "rotate-0 scale-100 opacity-100"
						: "-rotate-90 scale-75 opacity-0"
				)}
			/>
			<Moon
				aria-hidden
				className={cn(
					"absolute size-[1.05rem] transition-all duration-300",
					isDark
						? "rotate-0 scale-100 opacity-100"
						: "rotate-90 scale-75 opacity-0"
				)}
			/>
		</button>
	);
}
