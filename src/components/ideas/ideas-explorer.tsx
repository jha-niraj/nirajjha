"use client";

import { IdeaCard } from "@/components/ideas/idea-card";
import type { IdeaView } from "@/db/ideas";
import { cn } from "@/lib/utils";
import { useMemo, useState } from "react";

type Sort = "wanted" | "newest";

const STATUS_FILTERS = [
	{ id: "", label: "All" },
	{ id: "published", label: "Open" },
	{ id: "building", label: "Being built" },
	{ id: "shipped", label: "Shipped" },
];

const SCOPE_FILTERS = [
	{ id: "", label: "Any size" },
	{ id: "weekend", label: "A weekend" },
	{ id: "weeks", label: "A few weeks" },
	{ id: "big", label: "Bigger" },
];

export function IdeasExplorer({ ideas }: { ideas: IdeaView[] }) {
	const [status, setStatus] = useState("");
	const [scope, setScope] = useState("");
	const [sort, setSort] = useState<Sort>("wanted");

	const shown = useMemo(() => {
		const filtered = ideas.filter(
			(i) =>
				(!status || i.status === status) && (!scope || i.scope === scope)
		);

		return [...filtered].sort((a, b) =>
			sort === "wanted"
				? b.votes - a.votes || b.createdAt.localeCompare(a.createdAt)
				: b.createdAt.localeCompare(a.createdAt)
		);
	}, [ideas, status, scope, sort]);

	const Chip = ({
		on,
		onClick,
		children,
	}: {
		on: boolean;
		onClick: () => void;
		children: React.ReactNode;
	}) => (
		<button
			type="button"
			onClick={onClick}
			aria-pressed={on}
			className={cn(
				"rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
				on
					? "border-foreground bg-foreground text-background"
					: "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
			)}
		>
			{children}
		</button>
	);

	return (
		<div className="space-y-6">
			<div className="flex flex-wrap items-center gap-2">
				{STATUS_FILTERS.map((f) => (
					<Chip key={f.id || "all"} on={status === f.id} onClick={() => setStatus(f.id)}>
						{f.label}
					</Chip>
				))}

				<span className="mx-1 h-5 w-px bg-border" />

				{SCOPE_FILTERS.map((f) => (
					<Chip key={f.id || "any"} on={scope === f.id} onClick={() => setScope(f.id)}>
						{f.label}
					</Chip>
				))}

				<span className="ml-auto flex items-center gap-1 rounded-full border border-border p-0.5">
					{(["wanted", "newest"] as const).map((s) => (
						<button
							key={s}
							type="button"
							onClick={() => setSort(s)}
							aria-pressed={sort === s}
							className={cn(
								"rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors",
								sort === s
									? "bg-foreground text-background"
									: "text-muted-foreground hover:text-foreground"
							)}
						>
							{s === "wanted" ? "Most wanted" : "Newest"}
						</button>
					))}
				</span>
			</div>

			<p className="text-sm text-muted-foreground">
				{shown.length} {shown.length === 1 ? "idea" : "ideas"}
			</p>

			{shown.length === 0 ? (
				<div className="rounded-2xl border border-dashed border-border px-6 py-16 text-center">
					<p className="text-base font-medium text-foreground">
						Nothing here yet
					</p>
					<p className="mt-2 text-sm text-muted-foreground">
						Try a different filter, or propose something.
					</p>
				</div>
			) : (
				<ul className="grid gap-5 sm:grid-cols-2">
					{shown.map((idea) => (
						<li key={idea.id}>
							<IdeaCard idea={idea} />
						</li>
					))}
				</ul>
			)}
		</div>
	);
}
