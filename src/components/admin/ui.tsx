import { cn } from "@/lib/utils";
import Link from "next/link";

/** Page title plus optional right-hand action. Used by every admin page. */
export function PageHeader({
	title,
	description,
	action,
}: {
	title: string;
	description?: string;
	action?: React.ReactNode;
}) {
	return (
		<div className="mb-8 flex flex-wrap items-start justify-between gap-4 border-b border-border pb-6">
			<div>
				<h1 className="text-xl font-semibold tracking-tight">{title}</h1>
				{description && (
					<p className="mt-1.5 max-w-xl text-sm text-muted-foreground">
						{description}
					</p>
				)}
			</div>
			{action}
		</div>
	);
}

export function StatCard({
	label,
	value,
	hint,
	href,
}: {
	label: string;
	value: string | number;
	hint?: string;
	href?: string;
}) {
	const body = (
		<div
			className={cn(
				"rounded-xl border border-border bg-card p-4 transition-colors",
				href && "hover:border-foreground/30"
			)}
		>
			<p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
				{label}
			</p>
			<p className="mt-2 text-2xl font-semibold tabular-nums tracking-tight">
				{typeof value === "number" ? value.toLocaleString() : value}
			</p>
			{hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
		</div>
	);

	return href ? <Link href={href}>{body}</Link> : body;
}

export function Table({ children }: { children: React.ReactNode }) {
	// Scrolls in its own container so a wide table never makes the page scroll
	// sideways, which on a dashboard means losing the sidebar.
	return (
		<div className="overflow-x-auto rounded-xl border border-border">
			<table className="w-full min-w-[640px] text-sm">{children}</table>
		</div>
	);
}

export function Th({
	children,
	align = "left",
}: {
	children?: React.ReactNode;
	align?: "left" | "right";
}) {
	return (
		<th
			className={cn(
				"border-b border-border px-4 py-2.5 text-xs font-medium uppercase tracking-wider text-muted-foreground",
				align === "right" ? "text-right" : "text-left"
			)}
		>
			{children}
		</th>
	);
}

export function Td({
	children,
	align = "left",
	className,
}: {
	children?: React.ReactNode;
	align?: "left" | "right";
	className?: string;
}) {
	return (
		<td
			className={cn(
				"border-b border-border px-4 py-3 align-top last:border-b-0",
				align === "right" ? "text-right tabular-nums" : "text-left",
				className
			)}
		>
			{children}
		</td>
	);
}

const STATUS_STYLES: Record<string, string> = {
	pending: "border-border text-foreground",
	reviewing: "border-border text-muted-foreground",
	invited: "border-foreground bg-foreground text-background",
	declined: "border-border text-muted-foreground line-through",
};

export function StatusBadge({ status }: { status: string }) {
	return (
		<span
			className={cn(
				"inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium capitalize",
				STATUS_STYLES[status] ?? "border-border text-muted-foreground"
			)}
		>
			{status}
		</span>
	);
}

export function EmptyState({
	title,
	body,
}: {
	title: string;
	body?: string;
}) {
	return (
		<div className="rounded-xl border border-dashed border-border px-6 py-14 text-center">
			<p className="text-sm font-medium text-foreground">{title}</p>
			{body && <p className="mt-1.5 text-sm text-muted-foreground">{body}</p>}
		</div>
	);
}
