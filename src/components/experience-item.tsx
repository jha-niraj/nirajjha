import { cn } from "@/lib/utils";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

interface ExperienceItemProps {
	title: string;
	subtitle: string;
	href?: string;
	period: string;
	location?: string;
	badges?: readonly string[];
	note?: string;
	description?: readonly string[];
	/** Last item skips the connector line so the rail ends cleanly. */
	isLast?: boolean;
}

export function ExperienceItem({
	title,
	subtitle,
	href,
	period,
	location,
	badges,
	note,
	description,
	isLast,
}: ExperienceItemProps) {
	const linked = href && href !== "#";

	return (
		<li className="relative flex gap-5 pb-8 last:pb-0">
			{/* Rail: a dot on the timeline plus the connector to the next entry. */}
			<div className="relative flex flex-col items-center">
				<span className="mt-1.5 size-2 shrink-0 rounded-full border border-foreground bg-background" />
				{!isLast && (
					<span
						aria-hidden
						className="mt-1 w-px flex-1 bg-gradient-to-b from-border to-transparent"
					/>
				)}
			</div>

			<div className="min-w-0 flex-1 -mt-0.5">
				<div className="flex flex-wrap items-center gap-x-2 gap-y-1">
					<h3 className="text-base font-semibold tracking-tight">
						{linked ? (
							<Link
								href={href}
								target="_blank"
								rel="noopener noreferrer"
								className="group inline-flex items-center gap-1 hover:underline underline-offset-4"
							>
								{title}
								<ArrowUpRight className="size-3 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
							</Link>
						) : (
							title
						)}
					</h3>
					{badges?.map((badge) => (
						<span
							key={badge}
							className="rounded-full border border-border px-2 py-0.5 text-[11px] uppercase tracking-wider text-muted-foreground"
						>
							{badge}
						</span>
					))}
				</div>

				<div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm text-muted-foreground">
					<span>{subtitle}</span>
					<span className="text-border">·</span>
					<span className="tabular-nums">{period}</span>
					{location && (
						<>
							<span className="text-border">·</span>
							<span>{location}</span>
						</>
					)}
					{note && (
						<>
							<span className="text-border">·</span>
							<span>{note}</span>
						</>
					)}
				</div>

				{description && description.length > 0 && (
					<ul className={cn("mt-3 space-y-2")}>
						{description.map((line) => (
							<li
								key={line}
								className="flex gap-2.5 text-sm leading-relaxed text-muted-foreground sm:text-[14px]"
							>
								<span
									aria-hidden
									className="mt-[0.5em] size-1 shrink-0 rounded-full bg-border"
								/>
								<span className="text-pretty">{line}</span>
							</li>
						))}
					</ul>
				)}
			</div>
		</li>
	);
}
