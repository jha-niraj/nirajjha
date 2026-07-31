import { NotFoundView } from "@/components/not-found-view";
import { SiteShell } from "@/components/site-shell";
import type { Metadata } from "next";

/**
 * The global 404, for anything the (site) group never sees: multi-segment paths
 * like `/blog/old/thing` that match no route at all.
 *
 * A root `not-found.tsx` renders inside `app/layout.tsx` only, because route
 * group layouts do not apply to it, so the chrome has to be wrapped on by hand.
 * Without this the deep-404 case would render as bare text on a white page.
 */
/**
 * The `robots` override is load-bearing, despite Next emitting its own
 * `noindex` on a not-found render.
 *
 * The root layout declares `robots: { index: true, follow: true }` for the real
 * pages, and metadata merges down, so a 404 without this shipped two
 * contradictory tags: Next's `noindex` next to the layout's `index, follow`.
 * Crawlers resolve that by taking the strictest reading, but publishing a
 * contradiction and trusting the tie-break is not a plan. This makes the second
 * tag agree with the first.
 */
export const metadata: Metadata = {
	title: "Page not found",
	robots: { index: false, follow: true },
};

export default function NotFound() {
	return (
		<SiteShell>
			<NotFoundView />
		</SiteShell>
	);
}
