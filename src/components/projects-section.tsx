"use client";

import { useState } from "react";
import { DATA } from "@/data/resume";
import { ProjectCard } from "@/components/project-card";
import BlurFade from "@/components/magicui/blur-fade";
import { ChevronDown, ChevronUp } from "lucide-react";

const BLUR_FADE_DELAY = 0.04;

export function ProjectsSection() {
	const [showAll, setShowAll] = useState(false);

	const featured = DATA.projects.filter((p) => p.featured);
	const more = DATA.projects.filter((p) => !p.featured);
	const displayed = showAll ? DATA.projects : featured;

	return (
		<>
			<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 max-w-[800px] mx-auto">
				{displayed.map((project, id) => (
					<BlurFade
						key={project.title}
						delay={BLUR_FADE_DELAY * 12 + id * 0.05}
						inView
					>
						<ProjectCard
							href={project.href}
							title={project.title}
							description={project.description}
							dates={project.dates}
							tags={project.technologies}
							image={project.image}
							video={project.video}
							links={project.links}
						/>
					</BlurFade>
				))}
			</div>
			{more.length > 0 && (
				<div className="flex justify-center mt-8">
					<button
						onClick={() => setShowAll(!showAll)}
						className="group flex items-center gap-2 rounded-full border bg-card px-6 py-2.5 text-sm font-medium text-muted-foreground transition-all duration-300 hover:text-foreground hover:border-foreground/20 hover:shadow-md"
					>
						{showAll ? (
							<>
								Show Less
								<ChevronUp className="size-4 transition-transform group-hover:-translate-y-0.5" />
							</>
						) : (
							<>
								View All Projects ({DATA.projects.length})
								<ChevronDown className="size-4 transition-transform group-hover:translate-y-0.5" />
							</>
						)}
					</button>
				</div>
			)}
		</>
	);
}
