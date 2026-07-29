import {
	Boxes,
	Cloud,
	Cog,
	Database,
	Layers,
	Network,
	ServerCog,
	Sparkles,
	Workflow,
} from "lucide-react";
import {
	SiC,
	SiClaude,
	SiCplusplus,
	SiCursor,
	SiDocker,
	SiExpress,
	SiFramer,
	SiGit,
	SiJavascript,
	SiMongodb,
	SiNextdotjs,
	SiNodedotjs,
	SiPosthog,
	SiPostgresql,
	SiPostman,
	SiPrisma,
	SiReact,
	SiReactquery,
	SiRedis,
	SiRemix,
	SiShadcnui,
	SiSocketdotio,
	SiTailwindcss,
	SiTypescript,
	SiVercel,
} from "react-icons/si";

type IconType = React.ComponentType<{ className?: string }>;

/**
 * Icons only - no brand colours. The palette across the whole site is
 * foreground / muted-foreground / border, so a wall of vendor blues and
 * purples would be the one thing shouting on an otherwise quiet page.
 */
const techMap: Record<string, IconType> = {
	// Languages
	TypeScript: SiTypescript,
	JavaScript: SiJavascript,
	"C++": SiCplusplus,
	C: SiC,
	SQL: Database,

	// Frontend
	"Next.js": SiNextdotjs,
	"Next.js 15": SiNextdotjs,
	"React.js": SiReact,
	Remix: SiRemix,
	TailwindCSS: SiTailwindcss,
	"Shadcn UI": SiShadcnui,
	"TanStack Query": SiReactquery,
	"Framer Motion": SiFramer,

	// Backend
	"Node.js": SiNodedotjs,
	Express: SiExpress,
	"Server Actions": ServerCog,
	"REST APIs": Network,
	WebSockets: SiSocketdotio,
	"Background Workers": Cog,

	// Data
	PostgreSQL: SiPostgresql,
	pgvector: Boxes,
	MongoDB: SiMongodb,
	Redis: SiRedis,
	Prisma: SiPrisma,

	// AI
	Claude: SiClaude,
	OpenAI: Sparkles,
	"RAG & Embeddings": Layers,
	"Agent Pipelines": Workflow,
	Cursor: SiCursor,

	// Infra
	Docker: SiDocker,
	AWS: Cloud,
	Vercel: SiVercel,
	Git: SiGit,
	Postman: SiPostman,
	PostHog: SiPosthog,
};

export function TechBadge({ name }: { name: string }) {
	const Icon = techMap[name];

	return (
		<li className="group inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs text-muted-foreground transition-colors duration-300 hover:border-foreground/25 hover:text-foreground">
			{Icon ? <Icon className="size-3.5 shrink-0" /> : null}
			{name}
		</li>
	);
}

const CATEGORY_LABELS: Record<string, string> = {
	languages: "Languages",
	frontend: "Frontend",
	backend: "Backend",
	databases: "Data",
	ai: "AI",
	infra: "Infra & Tooling",
};

export function SkillCategory({
	category,
	skills,
}: {
	category: string;
	skills: readonly string[];
}) {
	return (
		<div className="space-y-2.5">
			<h3 className="text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground/70">
				{CATEGORY_LABELS[category] ?? category}
			</h3>
			<ul className="flex flex-wrap gap-1.5">
				{skills.map((skill) => (
					<TechBadge key={skill} name={skill} />
				))}
			</ul>
		</div>
	);
}
