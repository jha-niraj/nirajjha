import BlurFade from "@/components/magicui/blur-fade";
import BlurFadeText from "@/components/magicui/blur-fade-text";
import { ProjectsSection } from "@/components/projects-section";
import { ResumeCard } from "@/components/resume-card";
import { SkillCategory } from "@/components/tech-icons";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { DATA } from "@/data/resume";
import { FileText, Mail } from "lucide-react";
import Link from "next/link";
import Markdown from "react-markdown";

const BLUR_FADE_DELAY = 0.04;

export default function Page() {
	return (
		<main className="flex flex-col min-h-[100dvh] space-y-10">
			<section id="hero">
				<div className="mx-auto w-full max-w-2xl space-y-8">
					<div className="gap-2 flex justify-between">
						<div className="flex-col flex flex-1 space-y-1.5">
							<BlurFadeText
								delay={BLUR_FADE_DELAY}
								className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none"
								yOffset={8}
								text={`Hi, I'm ${DATA.name.split(" ")[0]} 👋`}
							/>
							<BlurFadeText
								className="max-w-[600px] md:text-xl"
								delay={BLUR_FADE_DELAY}
								text={DATA.description}
							/>
						</div>
						<BlurFade delay={BLUR_FADE_DELAY}>
							<Avatar className="size-48 border">
								<AvatarImage
									alt={DATA.name}
									src={DATA.avatarUrl}
								/>
								<AvatarFallback>{DATA.initials}</AvatarFallback>
							</Avatar>
						</BlurFade>
					</div>
					<BlurFade delay={BLUR_FADE_DELAY * 2}>
						<div className="flex flex-wrap gap-2">
							<Link
								href={DATA.resumeUrl}
								target="_blank"
								className="inline-flex items-center gap-2 rounded-full border bg-card px-4 py-1.5 text-sm font-medium text-muted-foreground transition-all duration-300 hover:text-foreground hover:border-foreground/20 hover:shadow-md"
							>
								<FileText className="size-3.5" />
								Resume
							</Link>
							<Link
								href={`mailto:${DATA.contact.email}`}
								className="inline-flex items-center gap-2 rounded-full border bg-card px-4 py-1.5 text-sm font-medium text-muted-foreground transition-all duration-300 hover:text-foreground hover:border-foreground/20 hover:shadow-md"
							>
								<Mail className="size-3.5" />
								{DATA.contact.email}
							</Link>
						</div>
					</BlurFade>
				</div>
			</section>

			<section id="about">
				<BlurFade delay={BLUR_FADE_DELAY * 3} inView>
					<h2 className="text-xl font-bold">About</h2>
				</BlurFade>
				<BlurFade delay={BLUR_FADE_DELAY * 4} inView>
					<Markdown className="prose max-w-full text-pretty font-sans text-sm text-muted-foreground dark:prose-invert">
						{DATA.summary}
					</Markdown>
				</BlurFade>
			</section>

			<section id="skills">
				<div className="flex min-h-0 flex-col gap-y-4">
					<BlurFade delay={BLUR_FADE_DELAY * 9} inView>
						<h2 className="text-xl font-bold">Tech Stack</h2>
					</BlurFade>
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
						{Object.entries(DATA.skills).map(
							([category, skills], idx) => (
								<BlurFade
									key={category}
									delay={BLUR_FADE_DELAY * 10 + idx * 0.1}
									inView
								>
									<SkillCategory
										category={category}
										skills={skills}
									/>
								</BlurFade>
							)
						)}
					</div>
				</div>
			</section>

			<section id="learning">
				<div className="flex min-h-0 flex-col gap-y-3">
					<BlurFade delay={BLUR_FADE_DELAY * 11} inView>
						<h2 className="text-xl font-bold">Currently Learning</h2>
					</BlurFade>
					<BlurFade delay={BLUR_FADE_DELAY * 12} inView>
						<div className="space-y-2">
							{DATA.currentlyLearning.map((item) => (
								<div
									key={item}
									className="flex items-start gap-3 text-sm text-muted-foreground"
								>
									<span className="mt-1.5 size-1.5 rounded-full bg-foreground/40 shrink-0 animate-pulse" />
									<span>{item}</span>
								</div>
							))}
						</div>
					</BlurFade>
				</div>
			</section>

			<section id="work">
				<div className="flex min-h-0 flex-col gap-y-3">
					<BlurFade delay={BLUR_FADE_DELAY * 5} inView>
						<h2 className="text-xl font-bold">Work Experience</h2>
					</BlurFade>
					{DATA.work.map((work, id) => (
						<BlurFade
							key={work.company}
							delay={BLUR_FADE_DELAY * 6 + id * 0.05}
							inView
						>
							<ResumeCard
								key={work.company}
								logoUrl={work.logoUrl}
								altText={work.company}
								title={work.company}
								subtitle={work.title}
								href={work.href}
								badges={work.badges}
								period={`${work.start} - ${work.end ?? "Present"}`}
								description={work.description}
							/>
						</BlurFade>
					))}
				</div>
			</section>

			<section id="education">
				<div className="flex min-h-0 flex-col gap-y-3">
					<BlurFade delay={BLUR_FADE_DELAY * 7} inView>
						<h2 className="text-xl font-bold">Education</h2>
					</BlurFade>
					{DATA.education.map((education, id) => (
						<BlurFade
							key={education.school}
							delay={BLUR_FADE_DELAY * 8 + id * 0.05}
							inView
						>
							<ResumeCard
								key={education.school}
								href={education.href}
								logoUrl={education.logoUrl}
								altText={education.school}
								title={education.school}
								subtitle={education.degree}
								period={`${education.start} - ${education.end}`}
							/>
						</BlurFade>
					))}
				</div>
			</section>

			<section id="projects">
				<div className="space-y-12 w-full py-12">
					<BlurFade delay={BLUR_FADE_DELAY * 11} inView>
						<div className="flex flex-col items-center justify-center space-y-4 text-center">
							<div className="space-y-2">
								<div className="inline-block rounded-lg bg-foreground text-background px-3 py-1 text-sm">
									My Projects
								</div>
								<h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
									Check out my latest work
								</h2>
								<p className="text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
									I&apos;ve worked on a variety of projects,
									from campus social platforms to AI-powered
									SaaS tools. Here are some of my favorites.
								</p>
							</div>
						</div>
					</BlurFade>
					<ProjectsSection />
				</div>
			</section>

			<section id="contact">
				<div className="grid items-center justify-center gap-4 px-4 text-center md:px-6 w-full py-12">
					<BlurFade delay={BLUR_FADE_DELAY * 16} inView>
						<div className="space-y-3">
							<div className="inline-block rounded-lg bg-foreground text-background px-3 py-1 text-sm">
								Contact
							</div>
							<h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
								Get in Touch
							</h2>
							<p className="mx-auto max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
								Want to chat? Shoot me a DM on{" "}
								<Link
									href={DATA.contact.social.X.url}
									target="_blank"
									className="text-foreground font-medium hover:underline underline-offset-4"
								>
									X (Twitter)
								</Link>{" "}
								or drop me an{" "}
								<Link
									href={`mailto:${DATA.contact.email}`}
									className="text-foreground font-medium hover:underline underline-offset-4"
								>
									email
								</Link>
								. I&apos;ll try to respond as soon as possible.
							</p>
						</div>
					</BlurFade>
				</div>
			</section>
		</main>
	);
}
