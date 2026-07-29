import BlurFade from "@/components/magicui/blur-fade";
import { ProjectCard } from "@/components/project-card";
import { DATA, VISIBLE_PROJECTS } from "@/data/resume";

const DELAY = 0.04;

/**
 * Every project, always. There is no "show more" toggle: hiding half the work
 * behind a click only made the section look emptier than it is.
 */
export function ProjectsSection() {
	return (
		<ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
			{VISIBLE_PROJECTS.map((project, i) => (
				<li key={project.title} className="flex">
					<BlurFade delay={DELAY * (i + 1)} inView className="flex w-full">
						<ProjectCard
							href={project.href}
							title={project.title}
							tagline={project.tagline}
							description={project.description}
							highlights={project.highlights}
							dates={project.dates}
							tags={project.technologies}
							image={project.image || undefined}
							video={project.video || undefined}
							active={project.active}
							links={project.links}
						/>
					</BlurFade>
				</li>
			))}
		</ul>
	);
}
