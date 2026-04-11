"use client";

import {
	SiNextdotjs,
	SiReact,
	SiTypescript,
	SiTailwindcss,
	SiFramer,
	SiNodedotjs,
	SiExpress,
	SiGo,
	SiPostgresql,
	SiMongodb,
	SiRedis,
	SiPrisma,
	SiSupabase,
	SiDocker,
	SiCloudflare,
	SiVercel,
	SiGit,
} from "react-icons/si";
import { Cloud } from "lucide-react";
import { cn } from "@/lib/utils";

type TechEntry = {
	icon: React.ComponentType<{ className?: string }>;
	color: string;
};

const techMap: Record<string, TechEntry> = {
	"Next.js": { icon: SiNextdotjs, color: "group-hover:text-foreground" },
	"React.js": { icon: SiReact, color: "group-hover:text-[#61DAFB]" },
	TypeScript: { icon: SiTypescript, color: "group-hover:text-[#3178C6]" },
	TailwindCSS: { icon: SiTailwindcss, color: "group-hover:text-[#06B6D4]" },
	"Shadcn UI": { icon: SiReact, color: "group-hover:text-foreground" },
	"Framer Motion": { icon: SiFramer, color: "group-hover:text-[#0055FF]" },
	Zustand: { icon: SiReact, color: "group-hover:text-[#764ABC]" },
	"Node.js": { icon: SiNodedotjs, color: "group-hover:text-[#5FA04E]" },
	Express: { icon: SiExpress, color: "group-hover:text-foreground" },
	Golang: { icon: SiGo, color: "group-hover:text-[#00ADD8]" },
	"REST APIs": { icon: SiNodedotjs, color: "group-hover:text-[#5FA04E]" },
	WebSockets: { icon: SiNodedotjs, color: "group-hover:text-[#010101]" },
	PostgreSQL: { icon: SiPostgresql, color: "group-hover:text-[#4169E1]" },
	MongoDB: { icon: SiMongodb, color: "group-hover:text-[#47A248]" },
	Redis: { icon: SiRedis, color: "group-hover:text-[#FF4438]" },
	Prisma: { icon: SiPrisma, color: "group-hover:text-[#2D3748]" },
	Drizzle: { icon: SiPostgresql, color: "group-hover:text-[#C5F74F]" },
	Supabase: { icon: SiSupabase, color: "group-hover:text-[#3FCF8E]" },
	Docker: { icon: SiDocker, color: "group-hover:text-[#2496ED]" },
	"AWS S3": { icon: Cloud, color: "group-hover:text-[#FF9900]" },
	Cloudflare: { icon: SiCloudflare, color: "group-hover:text-[#F38020]" },
	Vercel: { icon: SiVercel, color: "group-hover:text-foreground" },
	Git: { icon: SiGit, color: "group-hover:text-[#F05032]" },
};

export function TechBadge({
	name,
	className,
}: {
	name: string;
	className?: string;
}) {
	const tech = techMap[name];
	const Icon = tech?.icon;

	return (
		<div
			className={cn(
				"group flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm transition-all duration-300 hover:shadow-md hover:border-foreground/20 hover:-translate-y-0.5",
				className
			)}
		>
			{Icon && (
				<Icon
					className={cn(
						"size-4 text-muted-foreground transition-colors duration-300",
						tech.color
					)}
				/>
			)}
			<span className="text-muted-foreground group-hover:text-foreground transition-colors duration-300">
				{name}
			</span>
		</div>
	);
}

const categoryMeta: Record<string, { label: string; emoji: string }> = {
	frontend: { label: "Frontend", emoji: "🎨" },
	backend: { label: "Backend", emoji: "⚙️" },
	databases: { label: "Databases", emoji: "🗄️" },
	devops: { label: "DevOps & Infra", emoji: "☁️" },
};

export function SkillCategory({
	category,
	skills,
}: {
	category: string;
	skills: readonly string[];
}) {
	const meta = categoryMeta[category] || {
		label: category,
		emoji: "💻",
	};

	return (
		<div className="space-y-3">
			<h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
				<span>{meta.emoji}</span>
				{meta.label}
			</h3>
			<div className="flex flex-wrap gap-2">
				{skills.map((skill) => (
					<TechBadge key={skill} name={skill} />
				))}
			</div>
		</div>
	);
}
