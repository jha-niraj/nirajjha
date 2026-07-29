import Marquee from "@/components/magicui/marquee";
import { PostCard } from "@/components/post-card";
import type { PostSummary } from "@/lib/post-types";

/**
 * Two counter-scrolling rows of note cards. Falls back to a plain grid when
 * there are too few posts to fill a row, because a marquee with two cards in
 * it reads as broken rather than as motion.
 */
export function BlogMarquee({ posts }: { posts: PostSummary[] }) {
	if (posts.length === 0) return null;

	if (posts.length < 4) {
		return (
			<ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
				{posts.map((post) => (
					<li key={post.slug}>
						<PostCard post={post} />
					</li>
				))}
			</ul>
		);
	}

	const half = Math.ceil(posts.length / 2);

	return (
		<div className="relative -mx-5 overflow-hidden sm:-mx-8">
			{[posts.slice(0, half), posts.slice(half)].map((row, i) => (
				<Marquee
					key={i}
					reverse={i === 1}
					pauseOnHover
					className="py-2 [--duration:60s] [--gap:1.25rem]"
				>
					{row.map((post) => (
						<div key={post.slug} className="w-[340px] shrink-0">
							<PostCard post={post} compact />
						</div>
					))}
				</Marquee>
			))}

			{/* Edge fades so cards dissolve at the gutter instead of being cropped. */}
			<div
				aria-hidden
				className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-background to-transparent sm:w-28"
			/>
			<div
				aria-hidden
				className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-background to-transparent sm:w-28"
			/>
		</div>
	);
}
