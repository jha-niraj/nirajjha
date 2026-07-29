"use client";

import { PostCard } from "@/components/post-card";
import type { PostSummary } from "@/lib/post-types";
import { highlight, searchPosts } from "@/lib/search";
import { cn } from "@/lib/utils";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

type Sort = "newest" | "read";

const SORTS: { id: Sort; label: string }[] = [
	{ id: "newest", label: "Newest" },
	{ id: "read", label: "Most read" },
];

const FIELD_LABEL: Record<string, string> = {
	tag: "tag",
	title: "title",
	outline: "a heading",
	summary: "summary",
};

function Highlighted({ text, query }: { text: string; query: string }) {
	return (
		<>
			{highlight(text, query).map((part, i) =>
				part.match ? (
					<mark
						key={i}
						className="rounded bg-foreground/15 px-0.5 text-foreground"
					>
						{part.text}
					</mark>
				) : (
					<span key={i}>{part.text}</span>
				)
			)}
		</>
	);
}

export function BlogExplorer({
	posts,
	tags,
}: {
	posts: PostSummary[];
	tags: { tag: string; count: number }[];
}) {
	const [query, setQuery] = useState("");
	const [activeTags, setActiveTags] = useState<string[]>([]);
	const [sort, setSort] = useState<Sort>("newest");
	const inputRef = useRef<HTMLInputElement>(null);

	// "/" focuses search, Escape clears it. Cheap, and the kind of thing
	// people who read a lot of dev blogs reach for without thinking.
	useEffect(() => {
		function onKey(e: KeyboardEvent) {
			const el = document.activeElement;
			const typing =
				el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement;

			if (e.key === "/" && !typing) {
				e.preventDefault();
				inputRef.current?.focus();
			}
			if (e.key === "Escape" && typing && el === inputRef.current) {
				setQuery("");
				inputRef.current?.blur();
			}
		}
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, []);

	const hits = useMemo(() => {
		const found = searchPosts(posts, query, activeTags);

		// Relevance order is only meaningful while there is a query. Without
		// one, respect the reader's chosen sort.
		if (query.trim()) return found;

		return [...found].sort((a, b) =>
			sort === "read"
				? b.post.views - a.post.views ||
					b.post.publishedAt.localeCompare(a.post.publishedAt)
				: Number(b.post.featured) - Number(a.post.featured) ||
					b.post.publishedAt.localeCompare(a.post.publishedAt)
		);
	}, [posts, query, activeTags, sort]);

	const filtering = query.trim().length > 0 || activeTags.length > 0;

	function toggleTag(tag: string) {
		setActiveTags((prev) =>
			prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
		);
	}

	function reset() {
		setQuery("");
		setActiveTags([]);
	}

	return (
		<div className="space-y-8">
			<div className="space-y-4">
				<div className="relative">
					<Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
					<input
						ref={inputRef}
						type="search"
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						placeholder="Search posts, tags, headings"
						aria-label="Search posts"
						className="w-full rounded-full border border-border bg-card py-3 pl-11 pr-24 text-sm font-medium text-foreground outline-none transition-colors placeholder:font-normal placeholder:text-muted-foreground focus:border-foreground/40 [&::-webkit-search-cancel-button]:appearance-none"
					/>
					{query ? (
						<button
							type="button"
							onClick={() => setQuery("")}
							aria-label="Clear search"
							className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground transition-colors hover:text-foreground"
						>
							<X className="size-4" />
						</button>
					) : (
						<kbd className="pointer-events-none absolute right-4 top-1/2 hidden -translate-y-1/2 rounded border border-border px-1.5 py-0.5 font-sans text-[11px] font-medium text-muted-foreground sm:block">
							/
						</kbd>
					)}
				</div>

				<div className="flex flex-wrap items-center gap-2">
					<span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
						<SlidersHorizontal className="size-3" />
						Tags
					</span>
					{tags.map(({ tag, count }) => {
						const on = activeTags.includes(tag);
						return (
							<button
								key={tag}
								type="button"
								onClick={() => toggleTag(tag)}
								aria-pressed={on}
								className={cn(
									"rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
									on
										? "border-foreground bg-foreground text-background"
										: "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
								)}
							>
								{tag}
								<span
									className={cn(
										"ml-1.5 tabular-nums",
										on ? "text-background/70" : "text-muted-foreground/70"
									)}
								>
									{count}
								</span>
							</button>
						);
					})}

					<span className="ml-auto flex items-center gap-1 rounded-full border border-border p-0.5">
						{SORTS.map((s) => (
							<button
								key={s.id}
								type="button"
								onClick={() => setSort(s.id)}
								disabled={query.trim().length > 0}
								aria-pressed={sort === s.id}
								className={cn(
									"rounded-full px-3 py-1 text-xs font-medium transition-colors disabled:opacity-40",
									sort === s.id && !query.trim()
										? "bg-foreground text-background"
										: "text-muted-foreground hover:text-foreground"
								)}
							>
								{s.label}
							</button>
						))}
					</span>
				</div>
			</div>

			<div className="flex items-center justify-between gap-4 border-b border-border pb-3">
				<p className="text-sm font-medium text-muted-foreground">
					{hits.length} {hits.length === 1 ? "post" : "posts"}
					{query.trim() && (
						<>
							{" "}
							for <span className="text-foreground">{query.trim()}</span>
						</>
					)}
					{activeTags.length > 0 && (
						<>
							{" "}
							tagged{" "}
							<span className="text-foreground">{activeTags.join(" + ")}</span>
						</>
					)}
				</p>
				{filtering && (
					<button
						type="button"
						onClick={reset}
						className="text-sm font-medium text-muted-foreground underline underline-offset-4 transition-colors hover:text-foreground"
					>
						Reset
					</button>
				)}
			</div>

			{hits.length === 0 ? (
				<div className="rounded-2xl border border-dashed border-border px-6 py-16 text-center">
					<p className="text-base font-medium text-foreground">
						Nothing matches that yet.
					</p>
					<p className="mt-2 text-sm text-muted-foreground">
						Try a single word, or clear the tag filters.
					</p>
					<button
						type="button"
						onClick={reset}
						className="mt-5 rounded-full bg-foreground px-4 py-2 text-xs font-semibold text-background transition-opacity hover:opacity-85"
					>
						Reset filters
					</button>
				</div>
			) : (
				<ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
					{hits.map(({ post, matchedIn }) => (
						<li key={post.slug} className="flex flex-col gap-2">
							<PostCard post={post} />
							{query.trim() && matchedIn && (
								<p className="px-1 text-[11px] text-muted-foreground">
									Matched in {FIELD_LABEL[matchedIn]}:{" "}
									<Highlighted
										text={matchedIn === "title" ? post.title : post.summary}
										query={query}
									/>
								</p>
							)}
						</li>
					))}
				</ul>
			)}
		</div>
	);
}
