import { ApplyForm } from "@/components/apply-form";
import { ScrollToApply } from "@/components/scroll-to-apply";
import BlurFade from "@/components/magicui/blur-fade";
import { DATA } from "@/data/resume";
import { SITE_URL } from "@/lib/site";
import { GitPullRequest, Kanban, MessagesSquare, Users } from "lucide-react";
import type { Metadata } from "next";

const TITLE = "Contribute";
const DESCRIPTION =
	"Work on a real product with a real team. Open source contributions run like an actual engineering org: a board, cycles, code review, and feedback sessions.";

export const metadata: Metadata = {
	title: TITLE,
	description: DESCRIPTION,
	alternates: { canonical: "/contribute" },
	openGraph: {
		type: "website",
		title: `${TITLE}, ${DATA.shortName}`,
		description: DESCRIPTION,
		url: "/contribute",
	},
	twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

const HOW = [
	{
		icon: Kanban,
		title: "You get a board, not a task list",
		body: "Issues live on a real project board with cycles and priorities. You pick what you take, and you can see how it fits the roadmap.",
	},
	{
		icon: GitPullRequest,
		title: "Your PRs get reviewed properly",
		body: "Line by line, with reasons. Not a rubber stamp and not a drive-by nit. If something is wrong you will be told why, and how you would find it yourself next time.",
	},
	{
		icon: MessagesSquare,
		title: "Feedback sessions, not silence",
		body: "Regular written feedback on how you are working, not just what you shipped. The thing nobody gives you until your first job.",
	},
	{
		icon: Users,
		title: "You are a team member",
		body: "Same workspace, same rituals, same title as anyone else on the project. Nothing is labelled student, because after the first week the distinction stops meaning anything.",
	},
];

/**
 * The programme page.
 *
 * Written to filter rather than to recruit. Anyone who reads it and still
 * applies knows the commitment is real, which is the only screen that actually
 * works at this scale.
 */
export default function ContributePage() {
	return (
		<main className="pb-8">
			<BlurFade delay={0.04}>
				<header className="max-w-2xl border-b border-border pb-10">
					<p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
						Open source
					</p>
					<h1 className="mt-3 text-balance text-[1.75rem] font-semibold leading-[1.2] tracking-tight sm:text-[2.125rem]">
						Learn how a company actually builds software
					</h1>
					<p className="mt-4 text-base leading-relaxed text-muted-foreground">
						Most open source teaches you Git. This is meant to teach you the
						rest: how work gets scoped, why a review comment is what it is, and
						what it feels like to own something other people depend on.
					</p>
					<p className="mt-4 text-base leading-relaxed text-muted-foreground">
						You join a workspace alongside the real project, take issues off a
						real board, and ship. I review everything myself.
					</p>
					<ScrollToApply />
				</header>
			</BlurFade>

			<BlurFade delay={0.08}>
				<section className="mt-12 grid gap-6 sm:grid-cols-2">
					{HOW.map(({ icon: Icon, title, body }) => (
						<div key={title} className="flex gap-4">
							<span
								aria-hidden
								className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground"
							>
								<Icon className="size-4" />
							</span>
							<div>
								<h2 className="text-sm font-semibold text-foreground">
									{title}
								</h2>
								<p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
									{body}
								</p>
							</div>
						</div>
					))}
				</section>
			</BlurFade>

			<BlurFade delay={0.12}>
				<section className="mt-14 rounded-2xl border border-border p-6 sm:p-8">
					<h2 className="text-sm font-semibold text-foreground">
						Before you apply, the honest version
					</h2>
					<ul className="mt-4 space-y-2.5">
						{[
							"This is unpaid open source. It is worth your time for the review and the reference, not the money.",
							"Expect roughly five hours a week. Less than that and you lose the thread of what the team is doing.",
							"You need to be able to read a codebase you did not write. That is most of the job.",
							"The platform it runs on is still being built, so the first group will hit rough edges and be asked what broke.",
							"I would rather take four people who finish than forty who start.",
						].map((line) => (
							<li
								key={line}
								className="flex gap-2.5 text-sm leading-relaxed text-muted-foreground"
							>
								<span
									aria-hidden
									className="mt-[0.55em] size-1 shrink-0 rounded-full bg-border"
								/>
								<span className="text-pretty">{line}</span>
							</li>
						))}
					</ul>
				</section>
			</BlurFade>

			<BlurFade delay={0.16}>
				<section id="apply" className="mt-14 scroll-mt-28">
					<h2 className="text-lg font-semibold tracking-tight text-foreground">
						Apply
					</h2>
					<p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
						There is no deadline and no cohort. I read applications as they
						arrive and invite people when there is work that suits them.
					</p>
					<p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
						There is no motivation letter. Pick one of the questions and tell
						me how you would approach it. That is the whole application.
					</p>
					<div className="mt-6 max-w-3xl">
						<ApplyForm />
					</div>
				</section>
			</BlurFade>

			<script
				type="application/ld+json"
				suppressHydrationWarning
				dangerouslySetInnerHTML={{
					__html: JSON.stringify({
						"@context": "https://schema.org",
						"@type": "WebPage",
						"@id": `${SITE_URL}/contribute`,
						url: `${SITE_URL}/contribute`,
						name: `${TITLE}, ${DATA.name}`,
						description: DESCRIPTION,
						inLanguage: "en",
						about: { "@id": `${SITE_URL}/#person` },
					}),
				}}
			/>
		</main>
	);
}
