import { NotFoundArt } from "@/components/not-found-art";
import { getBlogPosts } from "@/data/blog";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import Link from "next/link";

/**
 * The body of the 404, shared by both not-found boundaries.
 *
 * There are two: `(site)/not-found.tsx` catches `notFound()` thrown by the post
 * route, which is where almost every real 404 comes from because any
 * single-segment URL resolves to `[slug]`. The root `not-found.tsx` catches
 * everything deeper. Both render this, so the page is identical either way.
 *
 * It lists actual posts rather than stopping at an apology. Someone who lands
 * here followed a link that no longer works, and the useful thing is a way back
 * into the writing, not a bigger error message.
 */
export async function NotFoundView() {
	const recent = (await getBlogPosts()).slice(0, 3);

	return (
		<section className="mx-auto flex w-full max-w-2xl flex-col items-center px-4 py-16 text-center sm:py-24">
			<div className="relative flex w-full items-center justify-center">
				<span
					aria-hidden
					className="nf-watermark pointer-events-none absolute select-none text-[9rem] sm:text-[12rem]"
				>
					404
				</span>
				<NotFoundArt />
			</div>

			<p className="mt-8 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
				Error 404
			</p>

			<h1 className="display-heading display-heading-xl mt-3 text-[2rem] leading-[1.1] sm:text-[2.75rem]">
				This page does not exist
			</h1>

			<p className="mt-4 max-w-md text-balance leading-relaxed text-muted-foreground">
				The address resolved most of the way and then ran out. Either the link
				that sent you here is out of date, or the page moved and I did not
				leave a forwarding note.
			</p>

			<div className="mt-8 flex flex-wrap items-center justify-center gap-3">
				<Link
					href="/"
					className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background transition-opacity hover:opacity-85"
				>
					Read the writing
					<ArrowRight className="size-4" />
				</Link>
				<Link
					href="/portfolio"
					className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
				>
					See the profile
				</Link>
			</div>

			{recent.length > 0 && (
				<div className="mt-14 w-full border-t border-border pt-8 text-left">
					<h2 className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
						Recent posts
					</h2>
					<ul className="mt-4 divide-y divide-border">
						{recent.map((post) => (
							<li key={post.slug}>
								<Link
									href={`/${post.slug}`}
									className="group flex items-start justify-between gap-4 py-4 transition-opacity hover:opacity-70"
								>
									<span className="min-w-0">
										<span className="block font-medium leading-snug text-foreground">
											{post.metadata.title}
										</span>
										<span className="mt-1 block text-sm leading-relaxed text-muted-foreground">
											{post.metadata.summary}
										</span>
									</span>
									<ArrowUpRight className="mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
								</Link>
							</li>
						))}
					</ul>
				</div>
			)}
		</section>
	);
}
