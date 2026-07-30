import { BlogMarquee } from "@/components/blog-marquee";
import { ExperienceItem } from "@/components/experience-item";
import { Hero } from "@/components/hero";
import BlurFade from "@/components/magicui/blur-fade";
import { ProjectsSection } from "@/components/projects-section";
import { Section, SectionHeading } from "@/components/section";
import { SkillCategory } from "@/components/tech-icons";
import { getBlogPosts } from "@/data/blog";
import { getCommentCounts, getViewCounts } from "@/db/queries";
import type { PostSummary } from "@/lib/post-types";
import { DATA } from "@/data/resume";
import { buildProfileGraph } from "@/lib/schema";
import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import Markdown from "react-markdown";

const DELAY = 0.04;

export const metadata: Metadata = {
	alternates: { canonical: "/portfolio" },
};

export const revalidate = 300;

export default async function PortfolioPage() {
	const all = (await getBlogPosts()).slice(0, 8);
	const slugs = all.map((p) => p.slug);
	const [views, commentCounts] = await Promise.all([
		getViewCounts(slugs),
		getCommentCounts(slugs),
	]);

	const posts: PostSummary[] = all.map((p) => ({
		slug: p.slug,
		title: p.metadata.title,
		summary: p.metadata.summary,
		publishedAt: p.metadata.publishedAt,
		readingTime: p.readingTime,
		tags: p.metadata.tags,
		art: p.metadata.art,
		featured: p.metadata.featured,
		outline: [],
		views: views[p.slug] ?? 0,
		comments: commentCounts[p.slug] ?? 0,
	}));

	return (
		<>
			<script
				type="application/ld+json"
				suppressHydrationWarning
				dangerouslySetInnerHTML={{
					__html: JSON.stringify(buildProfileGraph()),
				}}
			/>

			{/* The layout centres every route at max-w-7xl. The profile reads as a
			    single column of prose, so it is pulled in to 5xl here rather than
			    narrowing the layout and dragging the wider post pages in with it. */}
			<main className="mx-auto flex w-full max-w-5xl flex-col">
				<Hero />

				<Section id="about" className="mb-16">
					<BlurFade delay={DELAY} inView>
						<SectionHeading>About</SectionHeading>
					</BlurFade>
					<BlurFade delay={DELAY * 2} inView>
						<Markdown className="prose prose-base max-w-none text-pretty font-sans text-base leading-relaxed text-muted-foreground dark:prose-invert prose-p:my-0 prose-p:mb-4 last:prose-p:mb-0 prose-strong:font-medium prose-strong:text-foreground">
							{DATA.summary}
						</Markdown>
					</BlurFade>
				</Section>

				<Section id="experience" className="mb-16">
					<BlurFade delay={DELAY} inView>
						<SectionHeading>Experience</SectionHeading>
					</BlurFade>
					<BlurFade delay={DELAY * 2} inView>
						<ol className="list-none">
							{DATA.work.map((work, i) => (
								<ExperienceItem
									key={work.company}
									title={work.company}
									subtitle={work.title}
									href={work.href}
									period={`${work.start} - ${work.end}`}
									location={work.location}
									badges={work.badges}
									description={work.description}
									isLast={i === DATA.work.length - 1}
								/>
							))}
						</ol>
					</BlurFade>
				</Section>

				<Section id="projects" className="mb-16">
					<BlurFade delay={DELAY} inView>
						<SectionHeading>Selected Work</SectionHeading>
					</BlurFade>
					<ProjectsSection />
				</Section>

				<Section id="stack" className="mb-16">
					<BlurFade delay={DELAY} inView>
						<SectionHeading>Stack</SectionHeading>
					</BlurFade>
					<div className="grid gap-x-8 gap-y-7 sm:grid-cols-2 lg:grid-cols-3">
						{Object.entries(DATA.skills).map(([category, skills], i) => (
							<BlurFade key={category} delay={DELAY * (i + 1)} inView>
								<SkillCategory category={category} skills={skills} />
							</BlurFade>
						))}
					</div>
				</Section>

				<Section id="learning" className="mb-16">
					<BlurFade delay={DELAY} inView>
						<SectionHeading>Currently Learning</SectionHeading>
					</BlurFade>
					<BlurFade delay={DELAY * 2} inView>
						<ul className="space-y-2.5">
							{DATA.currentlyLearning.map((item) => (
								<li
									key={item}
									className="flex items-start gap-3 text-sm leading-relaxed text-muted-foreground sm:text-[14px]"
								>
									<span
										aria-hidden
										className="mt-[0.5em] size-1.5 shrink-0 animate-pulse rounded-full bg-foreground/40"
									/>
									<span className="text-pretty">{item}</span>
								</li>
							))}
						</ul>
					</BlurFade>
				</Section>

				{posts.length > 0 && (
					<Section id="writing" className="mb-16">
						<BlurFade delay={DELAY} inView>
							<SectionHeading
								action={
									<Link
										href="/"
										className="group inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
									>
										All posts
										<ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
									</Link>
								}
							>
								Writing
							</SectionHeading>
						</BlurFade>
						<BlurFade delay={DELAY * 2} inView>
							<BlogMarquee posts={posts} />
						</BlurFade>
					</Section>
				)}

				<Section id="education" className="mb-16">
					<BlurFade delay={DELAY} inView>
						<SectionHeading>Education</SectionHeading>
					</BlurFade>
					<BlurFade delay={DELAY * 2} inView>
						<ol className="list-none">
							{DATA.education.map((edu, i) => (
								<ExperienceItem
									key={edu.school}
									title={edu.school}
									subtitle={edu.degree}
									href={edu.href}
									period={`${edu.start} - ${edu.end}`}
									note={edu.note}
									isLast={i === DATA.education.length - 1}
								/>
							))}
						</ol>
					</BlurFade>
					<BlurFade delay={DELAY * 3} inView>
						<ul className="mt-2 flex flex-wrap gap-1.5">
							{DATA.credentials.map((c) => (
								<li
									key={c}
									className="rounded-md border border-border px-2 py-1 text-[12px] text-muted-foreground"
								>
									{c}
								</li>
							))}
						</ul>
					</BlurFade>
				</Section>

				<Section id="contact">
					<BlurFade delay={DELAY} inView>
						<SectionHeading>Contact</SectionHeading>
					</BlurFade>
					<BlurFade delay={DELAY * 2} inView>
						<div className="rounded-xl border border-border p-6 sm:p-8">
							<h3 className="text-2xl font-semibold tracking-tight sm:text-3xl">
								Building something interesting?
							</h3>
							<p className="mt-2 max-w-md text-pretty text-base leading-relaxed text-muted-foreground">
								I&apos;m always up for talking about AI products, backend
								design, or a problem that&apos;s been stuck for a while.
								Email is fastest - DMs on{" "}
								<Link
									href={DATA.contact.social.X.url}
									target="_blank"
									rel="noopener noreferrer"
									className="font-medium text-foreground underline underline-offset-4"
								>
									X
								</Link>{" "}
								work too.
							</p>
							<Link
								href={`mailto:${DATA.contact.email}`}
								className="mt-5 inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-85"
							>
								{DATA.contact.email}
								<ArrowRight className="size-3.5" />
							</Link>
						</div>
					</BlurFade>
				</Section>
			</main>
		</>
	);
}
