import { DATA } from "@/data/resume";
import Link from "next/link";

export function SiteFooter() {
	const year = new Date().getFullYear();

	return (
		<footer className="mt-24 border-t border-border pt-6">
			<div className="flex flex-col gap-4 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
				<p>
					© {year} {DATA.name}. Built with Next.js.
				</p>
				<nav className="flex flex-wrap items-center gap-x-4 gap-y-2">
					<Link href="/" className="transition-colors hover:text-foreground">
						Home
					</Link>
					<Link
						href="/blogs"
						className="transition-colors hover:text-foreground"
					>
						Blog
					</Link>
					<Link
						href="/feed.xml"
						className="transition-colors hover:text-foreground"
					>
						RSS
					</Link>
					{Object.entries(DATA.contact.social)
						.filter(([, s]) => s.navbar)
						.map(([key, social]) => (
							<Link
								key={key}
								href={social.url}
								target="_blank"
								rel="noopener noreferrer"
								className="transition-colors hover:text-foreground"
							>
								{social.name}
							</Link>
						))}
				</nav>
			</div>
		</footer>
	);
}
