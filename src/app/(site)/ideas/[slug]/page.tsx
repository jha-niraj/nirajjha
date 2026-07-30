import { Comments } from "@/components/comments";
import { SCOPE_LABELS, StatusChip } from "@/components/ideas/idea-card";
import { VoteButton } from "@/components/ideas/vote-button";
import BlurFade from "@/components/magicui/blur-fade";
import { PostArt } from "@/components/post-art";
import { DATA } from "@/data/resume";
import { getIdea, listIdeas } from "@/db/ideas";
import { getComments } from "@/db/queries";
import { SITE_URL } from "@/lib/site";
import { getVisitorId } from "@/lib/visitor-server";
import { ArrowLeft, ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export async function generateMetadata({
	params,
}: {
	params: Promise<{ slug: string }>;
}): Promise<Metadata> {
	const { slug } = await params;
	const idea = await getIdea(slug, null);
	if (!idea) return {};

	return {
		title: idea.title,
		description: idea.problem.slice(0, 180),
		alternates: { canonical: `/ideas/${idea.slug}` },
		openGraph: {
			type: "article",
			title: `${idea.title}, ${DATA.shortName}`,
			description: idea.problem.slice(0, 180),
			url: `/ideas/${idea.slug}`,
		},
	};
}

export default async function IdeaPage({
	params,
}: {
	params: Promise<{ slug: string }>;
}) {
	const { slug } = await params;
	const visitorId = await getVisitorId();

	const [idea, comments] = await Promise.all([
		getIdea(slug, visitorId),
		getComments(slug, visitorId ?? undefined, "idea"),
	]);

	// Pending and rejected-but-unpublished ideas are not addressable, so a
	// guessed URL cannot surface something that was never put on the board.
	if (!idea || idea.status === "pending") notFound();

	const others = (await listIdeas(visitorId))
		.filter((i) => i.slug !== idea.slug)
		.slice(0, 3);

	return (
		<>
			<script
				type="application/ld+json"
				suppressHydrationWarning
				dangerouslySetInnerHTML={{
					__html: JSON.stringify({
						"@context": "https://schema.org",
						"@type": "CreativeWork",
						"@id": `${SITE_URL}/ideas/${idea.slug}`,
						url: `${SITE_URL}/ideas/${idea.slug}`,
						name: idea.title,
						description: idea.problem,
						inLanguage: "en",
						creator: { "@type": "Person", name: idea.proposerName },
					}),
				}}
			/>

			<main className="pb-8">
				<BlurFade delay={0.04}>
					<Link
						href="/ideas"
						className="group mb-8 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
					>
						<ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-0.5" />
						All ideas
					</Link>
				</BlurFade>

				<div className="grid gap-10 lg:grid-cols-[minmax(0,68ch)_260px] lg:gap-14">
					<div className="min-w-0">
						<BlurFade delay={0.08}>
							<header>
								<div className="flex flex-wrap items-center gap-2">
									<StatusChip status={idea.status} />
									<span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
										{SCOPE_LABELS[idea.scope] ?? idea.scope}
									</span>
								</div>

								<h1 className="mt-4 text-balance text-[1.75rem] font-semibold leading-[1.2] tracking-tight sm:text-[2.125rem]">
									{idea.title}
								</h1>

								<p className="mt-3 text-sm text-muted-foreground">
									Proposed by {idea.proposerName}
									{idea.proposerGithub && (
										<>
											{" "}
											<a
												href={`https://github.com/${idea.proposerGithub}`}
												target="_blank"
												rel="noopener noreferrer"
												className="underline underline-offset-4 hover:text-foreground"
											>
												@{idea.proposerGithub}
											</a>
										</>
									)}
								</p>

								<div className="mt-7 aspect-[16/7] w-full overflow-hidden rounded-2xl border border-border">
									<PostArt art={idea.art ?? undefined} slug={idea.slug} />
								</div>
							</header>
						</BlurFade>

						<BlurFade delay={0.12}>
							<section className="mt-10">
								<h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
									The problem
								</h2>
								<p className="mt-3 whitespace-pre-wrap text-[17px] leading-[1.8] text-muted-foreground">
									{idea.problem}
								</p>

								<h2 className="mt-9 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
									What should exist
								</h2>
								<p className="mt-3 whitespace-pre-wrap text-[17px] leading-[1.8] text-muted-foreground">
									{idea.proposal}
								</p>
							</section>
						</BlurFade>

						{/* Public, and deliberately so: an idea that says why it was
						    turned down teaches the next person what a good one looks
						    like. */}
						{idea.reviewNote && (
							<BlurFade delay={0.16}>
								<aside className="mt-9 rounded-2xl border border-border bg-card p-5">
									<p className="text-sm font-semibold text-foreground">
										What happened to it
									</p>
									<p className="mt-2 text-sm leading-relaxed text-muted-foreground">
										{idea.reviewNote}
									</p>
									{idea.projectUrl && (
										<a
											href={idea.projectUrl}
											target="_blank"
											rel="noopener noreferrer"
											className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-foreground px-4 py-2 text-xs font-semibold text-background transition-opacity hover:opacity-85"
										>
											See the project
											<ExternalLink className="size-3" />
										</a>
									)}
								</aside>
							</BlurFade>
						)}

						<Comments
							slug={idea.slug}
							subjectType="idea"
							initial={comments}
							title="Discussion"
						/>
					</div>

					<aside className="lg:sticky lg:top-24 lg:self-start">
						<div className="rounded-2xl border border-border bg-card p-5">
							<div className="flex items-center gap-4">
								<VoteButton
									slug={idea.slug}
									votes={idea.votes}
									voted={idea.voted}
									size="lg"
								/>
								<div>
									<p className="text-sm font-semibold text-foreground">
										{idea.voted ? "You want this" : "Would you use this?"}
									</p>
									<p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
										Interest decides what gets built next.
									</p>
								</div>
							</div>

							<dl className="mt-5 space-y-2.5 border-t border-border pt-4 text-sm">
								{[
									["Size", SCOPE_LABELS[idea.scope] ?? idea.scope],
									...(idea.audience ? [["For", idea.audience]] : []),
									...(idea.stack.length
										? [["Stack", idea.stack.join(", ")]]
										: []),
								].map(([label, value]) => (
									<div key={label} className="flex justify-between gap-4">
										<dt className="shrink-0 text-muted-foreground">{label}</dt>
										<dd className="text-right font-medium">{value}</dd>
									</div>
								))}
							</dl>
						</div>

						{others.length > 0 && (
							<div className="mt-6">
								<p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
									Other ideas
								</p>
								<ul className="space-y-2">
									{others.map((o) => (
										<li key={o.id}>
											<Link
												href={`/ideas/${o.slug}`}
												className="flex items-center justify-between gap-3 rounded-xl border border-border px-3.5 py-2.5 text-sm transition-colors hover:border-foreground/30"
											>
												<span className="line-clamp-1">{o.title}</span>
												<span className="shrink-0 text-xs tabular-nums text-muted-foreground">
													{o.votes}
												</span>
											</Link>
										</li>
									))}
								</ul>
							</div>
						)}
					</aside>
				</div>
			</main>
		</>
	);
}
