"use client";

import { ModeToggle } from "@/components/mode-toggle";
import { DATA } from "@/data/resume";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useId } from "react";

/**
 * Ideas and Contribute moved to BuilderHQ, which has real accounts. They stay
 * in the nav because the destinations still matter; `external` is what stops
 * the active-item logic from ever trying to match them against a local path.
 */
const NAV = [
	{ href: "/", label: "Blogs" },
	{ href: "/portfolio", label: "Portfolio" },
	{ href: "https://buildrhq.com/ideas", label: "Ideas", external: true },
	{ href: "https://buildrhq.com", label: "BuildrHQ", external: true },
];

/**
 * Decides which nav item is lit.
 *
 * Posts live at the root (`/some-post`), so an exact match would leave nothing
 * highlighted while reading one. Anything that is not a known static route is
 * treated as a post, which belongs under Blog.
 */
function activeHref(pathname: string): string {
	if (pathname === "/") return "/";
	const match = NAV.find(
		(item) =>
			!("external" in item && item.external) &&
			item.href !== "/" &&
			pathname.startsWith(item.href)
	);
	return match ? match.href : "/";
}

export function SiteHeader() {
	const pathname = usePathname();
	const active = activeHref(pathname);
	// Scopes the shared-layout animation to this instance, so the pill can never
	// try to animate between two headers if one is ever mounted twice.
	const layoutId = useId();

	return (
		<header className="theme-vt-glass sticky top-0 z-40 -mx-4 mb-12 rounded-t-2xl border-b border-border/70 bg-background/85 px-4 backdrop-blur-md sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
			<div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4">
				<Link
					href="/"
					className="group flex shrink-0 items-center gap-2.5 text-sm font-semibold tracking-tight"
				>
					<Image
						src={DATA.avatarUrl}
						alt=""
						width={28}
						height={28}
						className="size-7 rounded-full border border-border object-cover transition-transform duration-300 group-hover:scale-105"
					/>
					<span className="hidden sm:inline">{DATA.shortName}</span>
				</Link>

				<nav className="flex items-center gap-1">
					{/* One pill that slides between items via shared layout, rather
					    than a background per link fading in and out. That is what
					    makes it read as a single control changing state instead of
					    two separate things blinking. */}
					<div className="flex items-center rounded-full border border-border/70 p-0.5">
						{NAV.map((item) => {
							const on = active === item.href;
							return (
								<Link
									key={item.href}
									href={item.href}
									{...("external" in item && item.external
										? { target: "_blank", rel: "noopener noreferrer" }
										: {})}
									aria-current={on ? "page" : undefined}
									className={cn(
										"relative rounded-full px-2.5 py-1.5 text-sm font-medium transition-colors sm:px-3.5",
										on
											? "text-background"
											: "text-muted-foreground hover:text-foreground"
									)}
								>
									{on && (
										<motion.span
											layoutId={layoutId}
											transition={{
												type: "spring",
												stiffness: 380,
												damping: 32,
											}}
											className="absolute inset-0 -z-10 rounded-full bg-foreground"
										/>
									)}
									{item.label}
								</Link>
							);
						})}
					</div>

					<span className="mx-1 hidden h-5 w-px bg-border sm:block" />
					<ModeToggle />
				</nav>
			</div>
		</header>
	);
}
