import { cn } from "@/lib/utils";
import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface Props {
	title: string;
	href?: string;
	tagline?: string;
	description: string;
	highlights?: readonly string[];
	dates: string;
	tags: readonly string[];
	image?: string;
	video?: string;
	active?: boolean;
	links?: readonly {
		icon: React.ReactNode;
		type: string;
		href: string;
	}[];
	className?: string;
}

/**
 * Stand-in for projects that have no screenshot yet: a monochrome plate with
 * the project's initials. Deliberately quiet, so an unshot project doesn't
 * shout louder than one with real artwork.
 */
function Placeholder({ title }: { title: string }) {
	const initials = title
		.replace(/[^\p{L}\p{N} ]/gu, "")
		.split(/\s+/)
		.slice(0, 2)
		.map((w) => w[0])
		.join("")
		.toUpperCase();

	return (
		<div className="flex h-full w-full items-center justify-center bg-muted">
			<span
				aria-hidden
				className="text-4xl font-semibold tracking-tight text-muted-foreground/50"
			>
				{initials}
			</span>
		</div>
	);
}

export function ProjectCard({
	title,
	href,
	tagline,
	description,
	highlights,
	dates,
	tags,
	image,
	video,
	active,
	links,
	className,
}: Props) {
	const linked = href && href.startsWith("http");
	const Media = (
		<div className="relative h-40 w-full overflow-hidden border-b border-border bg-muted">
			{video ? (
				<video
					src={video}
					autoPlay
					loop
					muted
					playsInline
					className="pointer-events-none h-full w-full object-cover object-top"
				/>
			) : image ? (
				<Image
					src={image}
					alt={`${title} - ${tagline ?? "project"} screenshot`}
					fill
					sizes="(min-width: 640px) 50vw, 100vw"
					className="object-cover object-top transition-transform duration-500 ease-out group-hover:scale-[1.03]"
				/>
			) : (
				<Placeholder title={title} />
			)}
		</div>
	);

	return (
		<article
			className={cn(
				"group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card transition-colors duration-300 hover:border-foreground/25",
				className
			)}
		>
			{/* The media is deliberately not a second link to the same URL - the
			    title below already links out, and a duplicate would be announced
			    twice by a screen reader. The alt text stays descriptive for image
			    search rather than being blanked as decorative. */}
			{Media}

			<div className="flex flex-1 flex-col gap-3 p-4">
				<div className="space-y-1">
					<div className="flex items-start justify-between gap-3">
						<h3 className="text-base font-semibold tracking-tight">
							{linked ? (
								<Link
									href={href}
									target="_blank"
									rel="noopener noreferrer"
									className="inline-flex items-center gap-1 hover:underline underline-offset-4"
								>
									{title}
									<ArrowUpRight className="size-3 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
								</Link>
							) : (
								title
							)}
						</h3>
						<span className="shrink-0 pt-0.5 text-[11px] tabular-nums text-muted-foreground">
							{dates}
						</span>
					</div>
					{tagline && (
						<p className="text-sm text-muted-foreground">
							{tagline}
							{active ? (
								<span className="ml-2 text-[11px] uppercase tracking-wider text-foreground/70">
									· Live
								</span>
							) : null}
						</p>
					)}
				</div>

				<p className="text-pretty text-sm leading-relaxed text-muted-foreground">
					{description}
				</p>

				{highlights && highlights.length > 0 && (
					<ul className="space-y-1.5">
						{highlights.map((h) => (
							<li
								key={h}
								className="flex gap-2 text-[12px] leading-relaxed text-muted-foreground"
							>
								<span
									aria-hidden
									className="mt-[0.55em] size-1 shrink-0 rounded-full bg-border"
								/>
								<span className="text-pretty">{h}</span>
							</li>
						))}
					</ul>
				)}

				<div className="mt-auto space-y-3 pt-1">
					{tags.length > 0 && (
						<ul className="flex flex-wrap gap-1.5">
							{tags.map((tag) => (
								<li
									key={tag}
									className="rounded-md border border-border px-1.5 py-0.5 text-[11px] text-muted-foreground"
								>
									{tag}
								</li>
							))}
						</ul>
					)}

					{links && links.length > 0 && (
						<div className="flex flex-wrap gap-1.5">
							{links.map((link) => (
								<Link
									key={link.href}
									href={link.href}
									target="_blank"
									rel="noopener noreferrer"
									className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-2.5 py-1 text-[11px] font-medium text-background transition-opacity hover:opacity-85"
								>
									{link.icon}
									{link.type}
								</Link>
							))}
						</div>
					)}
				</div>
			</div>
		</article>
	);
}
