import { cn } from "@/lib/utils";

export function Section({
	id,
	className,
	children,
}: {
	id?: string;
	className?: string;
	children: React.ReactNode;
}) {
	return (
		<section id={id} className={cn("scroll-mt-24", className)}>
			{children}
		</section>
	);
}

/**
 * The one section header used everywhere: a hairline rule with a small
 * all-caps label on the left and an optional action on the right. Keeping it
 * in one place is what makes the page read as a single document rather than a
 * stack of unrelated widgets.
 */
export function SectionHeading({
	children,
	action,
	className,
}: {
	children: React.ReactNode;
	action?: React.ReactNode;
	className?: string;
}) {
	return (
		<div
			className={cn(
				"mb-6 flex items-center justify-between gap-4 border-b border-border pb-3",
				className
			)}
		>
			<h2 className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
				{children}
			</h2>
			{action ? <div className="shrink-0">{action}</div> : null}
		</div>
	);
}
