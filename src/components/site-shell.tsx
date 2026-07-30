"use client";

import { AIPanelMount } from "@/components/ai/ai-panel-mount";
import Navbar from "@/components/navbar";
import { ScrollToTop } from "@/components/scroll-to-top";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { ScrollArea } from "@/components/ui/scroll-area";

/**
 * The site frame: a fixed-height viewport with the page scrolling inside it.
 *
 * The whole point is that the rounded card and the docked assistant are part of
 * the window, not part of the document. Previously the shell was `min-h-screen`
 * and the document scrolled, so the card's top edge slid away as soon as you
 * moved and the two panels drifted out of alignment. Here the outer frame is
 * `h-screen overflow-hidden`, the card is pinned inside it, and only the
 * article moves.
 *
 * It also lives in the (site) layout rather than in each page, which is what
 * makes the assistant survive navigation: a layout is not remounted when the
 * page inside it changes, so an open conversation stays open and only the left
 * column swaps.
 */
export function SiteShell({
	postTitles,
	children,
}: {
	/** slug -> title, so the panel can name the post without a server call. */
	postTitles: Record<string, string>;
	children: React.ReactNode;
}) {
	return (
		<div className="flex h-screen w-full overflow-hidden bg-background">
			<div className="min-w-0 flex-1 transition-[padding] duration-300 ease-out lg:pr-[var(--ai-panel-inset,0px)]">
				<div className="m-2 h-[calc(100vh-1rem)] overflow-hidden rounded-2xl border border-border bg-card/30 shadow-sm sm:m-3 sm:h-[calc(100vh-1.5rem)]">
					{/* `data-scroll-root` is the contract with everything that used to
					    read window.scrollY: the progress bar, the contents rail and
					    the selection button all find the scroller through it. */}
					<ScrollArea
						className="h-full"
						viewportProps={{ "data-scroll-root": "" } as React.HTMLAttributes<HTMLDivElement>}
					>
						<div className="px-4 sm:px-6 lg:px-8">
							<SiteHeader />
							<div className="mx-auto w-full max-w-7xl">{children}</div>
							<div className="mx-auto w-full max-w-7xl pb-28">
								<SiteFooter />
							</div>
						</div>
					</ScrollArea>
				</div>
			</div>

			<ScrollToTop />
			<AIPanelMount postTitles={postTitles} />
			<Navbar />
		</div>
	);
}
