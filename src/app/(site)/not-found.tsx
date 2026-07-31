import { NotFoundView } from "@/components/not-found-view";

/**
 * Catches `notFound()` from the post route, which is where nearly every 404
 * actually arrives: any single-segment URL matches `[slug]` first, so
 * `/anything` lands here rather than at the root boundary.
 *
 * Being inside the (site) group means it renders with the header, footer and
 * dock already around it, so a reader who mistypes a slug stays on the site
 * instead of dropping onto a bare page with no way out.
 */
export default function SiteNotFound() {
	return <NotFoundView />;
}
