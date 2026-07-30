import BlurFade from "@/components/magicui/blur-fade";
import { IdeasExplorer } from "@/components/ideas/ideas-explorer";
import { ProposeSheet } from "@/components/ideas/propose-sheet";
import { DATA } from "@/data/resume";
import { listIdeas } from "@/db/ideas";
import { SITE_URL } from "@/lib/site";
import { getVisitorId } from "@/lib/visitor-server";
import type { Metadata } from "next";

const TITLE = "Ideas";
const DESCRIPTION =
	"Open-source projects people want to exist. Vote on the ones you would use, or propose your own. The ones with real interest get built with a team.";

export const metadata: Metadata = {
	title: TITLE,
	description: DESCRIPTION,
	alternates: { canonical: "/ideas" },
	openGraph: {
		type: "website",
		title: `${TITLE}, ${DATA.shortName}`,
		description: DESCRIPTION,
		url: "/ideas",
	},
	twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

/**
 * Reads the visitor cookie to mark which ideas you already voted for, which
 * makes this route dynamic. That is the right trade here: the board changes
 * whenever anybody votes, so there was nothing worth caching.
 */
export const dynamic = "force-dynamic";

export default async function IdeasPage() {
	const visitorId = await getVisitorId();
	const ideas = await listIdeas(visitorId);

	return (
		<>
			<script
				type="application/ld+json"
				suppressHydrationWarning
				dangerouslySetInnerHTML={{
					__html: JSON.stringify({
						"@context": "https://schema.org",
						"@type": "CollectionPage",
						"@id": `${SITE_URL}/ideas`,
						url: `${SITE_URL}/ideas`,
						name: `${TITLE}, ${DATA.name}`,
						description: DESCRIPTION,
						inLanguage: "en",
						about: { "@id": `${SITE_URL}/#person` },
					}),
				}}
			/>

			<main className="pb-8">
				<BlurFade delay={0.04}>
					<header className="mb-10 flex flex-col gap-5 border-b border-border pb-10 sm:flex-row sm:items-end sm:justify-between">
						<div>
							<p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
								Open source
							</p>
							<h1 className="mt-3 text-balance text-[1.75rem] font-semibold leading-[1.2] tracking-tight sm:text-[2.125rem]">
								Things that should exist
							</h1>
							<p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
								Projects people want built. Vote for the ones you would
								actually use, and the ones with real interest become open-source
								projects with a board, a team and proper code review.
							</p>
							<p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
								Voting is a signal, not a ballot. I pick what I can scope, and
								every idea says what happened to it.
							</p>
						</div>
						<div className="shrink-0">
							<ProposeSheet />
						</div>
					</header>
				</BlurFade>

				<BlurFade delay={0.08}>
					<IdeasExplorer ideas={ideas} />
				</BlurFade>
			</main>
		</>
	);
}
