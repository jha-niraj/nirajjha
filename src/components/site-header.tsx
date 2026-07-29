"use client";

import { ModeToggle } from "@/components/mode-toggle";
import { DATA } from "@/data/resume";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
	{ href: "/", label: "Profile" },
	{ href: "/blogs", label: "Blog" },
];

export function SiteHeader() {
	const pathname = usePathname();

	return (
		<header className="sticky top-0 z-40 -mx-5 mb-14 border-b border-border/70 bg-background/80 px-5 backdrop-blur-md sm:-mx-8 sm:px-8">
			<div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-6">
				<Link
					href="/"
					className="group flex items-center gap-2.5 text-sm font-semibold tracking-tight"
				>
					<Image
						src={DATA.avatarUrl}
						alt=""
						width={28}
						height={28}
						className="size-7 rounded-full border border-border object-cover"
					/>
					<span className="hidden sm:inline">{DATA.shortName}</span>
				</Link>

				<nav className="flex items-center gap-1">
					{NAV.map((item) => {
						// "/blogs" stays active while reading a post, since posts live
						// at the root and would otherwise light up nothing.
						const active =
							item.href === "/"
								? pathname === "/"
								: pathname === item.href ||
									(item.href === "/blogs" && pathname !== "/");

						return (
							<Link
								key={item.href}
								href={item.href}
								aria-current={active ? "page" : undefined}
								className={cn(
									"rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
									active
										? "bg-foreground text-background"
										: "text-muted-foreground hover:text-foreground"
								)}
							>
								{item.label}
							</Link>
						);
					})}
					<span className="mx-1 h-5 w-px bg-border" />
					<ModeToggle />
				</nav>
			</div>
		</header>
	);
}
