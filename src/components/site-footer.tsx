import { DATA } from "@/data/resume";
import { Signature } from "@/components/signature";
import Link from "next/link";

export function SiteFooter() {
	const year = new Date().getFullYear();

	return (
		<footer className="mt-24 border-t border-border pt-6">
			<div className="flex flex-col gap-4 text-base text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
				<p>
					© {year} {DATA.name}
				</p>
				<nav className="flex flex-wrap items-center gap-x-4 gap-y-2 text-base">
					<Link href="/" className="transition-colors hover:text-foreground">
						Blog
					</Link>
					<Link
						href="https://builderhq.com/ideas"
						target="_blank"
						rel="noopener noreferrer"
						className="transition-colors hover:text-foreground"
					>
						Ideas
					</Link>
					<Link
						href="/portfolio"
						className="transition-colors hover:text-foreground"
					>
						Profile
					</Link>
					<Link
						href="https://builderhq.com/contribute"
						target="_blank"
						rel="noopener noreferrer"
						className="transition-colors hover:text-foreground"
					>
						Contribute
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

			{/*
			  The wordmark. Sits below everything as the last thing on the page,
			  sized off the viewport so it always spans the full width, and cropped
			  at the baseline so it reads as the page running out rather than as a
			  heading that happens to be large.

			  `select-none` and `aria-hidden` on the wrapper: the name is already in
			  the copyright line above and in the page's <h1>, so announcing it a
			  third time is noise. The Signature keeps its own sr-only copy for the
			  cases where it is the only instance, which is why this wrapper hides
			  the whole thing rather than relying on that.
			*/}
			<div aria-hidden className="mt-14 select-none">
				<Signature text={DATA.shortName} />
			</div>
		</footer>
	);
}
