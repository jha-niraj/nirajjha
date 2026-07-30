"use client";

import { signOut } from "@/lib/auth/client";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
	FileText,
	LayoutDashboard,
	Lightbulb,
	LogOut,
	Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useId, useState } from "react";

const NAV = [
	{ href: "/admin/overview", label: "Overview", icon: LayoutDashboard },
	{ href: "/admin/blogs", label: "Posts", icon: FileText },
	{ href: "/admin/ideas", label: "Ideas", icon: Lightbulb },
	{ href: "/admin/applications", label: "Applications", icon: Users },
];

function isActive(pathname: string, href: string) {
	return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminShell({
	email,
	pending,
	children,
}: {
	email: string;
	/** Badge on the Applications item, so the queue is visible from anywhere. */
	pending: number;
	children: React.ReactNode;
}) {
	const pathname = usePathname();
	const router = useRouter();
	const layoutId = useId();
	const [leaving, setLeaving] = useState(false);

	async function leave() {
		setLeaving(true);
		await signOut();
		router.replace("/admin");
		router.refresh();
	}

	return (
		<div className="flex min-h-screen bg-background">
			<aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-border p-3 lg:flex">
				<div className="px-2 py-3">
					<p className="text-sm font-semibold tracking-tight">Admin</p>
					<p className="truncate text-xs text-muted-foreground">nirajjha.in</p>
				</div>

				<nav className="mt-2 flex flex-col gap-0.5">
					{NAV.map((item) => {
						const on = isActive(pathname, item.href);
						return (
							<Link
								key={item.href}
								href={item.href}
								className={cn(
									"relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
									on
										? "text-foreground"
										: "text-muted-foreground hover:text-foreground"
								)}
							>
								{on && (
									<motion.span
										layoutId={layoutId}
										transition={{ type: "spring", stiffness: 380, damping: 32 }}
										className="absolute inset-0 -z-10 rounded-lg bg-muted"
									/>
								)}
								<item.icon className="size-4 shrink-0" />
								{item.label}
								{item.href === "/admin/applications" && pending > 0 && (
									<span className="ml-auto rounded-full bg-foreground px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-background">
										{pending}
									</span>
								)}
							</Link>
						);
					})}
				</nav>

				<div className="mt-auto border-t border-border pt-3">
					<p className="truncate px-2.5 text-xs text-muted-foreground">
						{email}
					</p>
					<button
						type="button"
						onClick={leave}
						disabled={leaving}
						className="mt-2 flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
					>
						<LogOut className="size-4" />
						{leaving ? "Signing out" : "Sign out"}
					</button>
				</div>
			</aside>

			{/* Mobile: the same destinations as a bar, since a drawer for four
			    links is more chrome than the links are worth. */}
			<nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-border bg-background/95 backdrop-blur lg:hidden">
				{NAV.map((item) => {
					const on = isActive(pathname, item.href);
					return (
						<Link
							key={item.href}
							href={item.href}
							className={cn(
								"flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors",
								on ? "text-foreground" : "text-muted-foreground"
							)}
						>
							<item.icon className="size-4" />
							{item.label}
						</Link>
					);
				})}
			</nav>

			<main className="min-w-0 flex-1 px-5 pb-24 pt-6 sm:px-8 lg:pb-10">
				<div className="mx-auto w-full max-w-6xl">{children}</div>
			</main>
		</div>
	);
}
