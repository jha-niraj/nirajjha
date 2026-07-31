/**
 * Small animated marks for the index counters.
 *
 * Hand-drawn rather than Lucide because these four are not generic UI glyphs:
 * each one animates the thing it counts. A page settling onto a stack, a pupil
 * that looks around, a heart that beats, a third figure arriving behind two
 * that were already there. An icon that moves the way its number grows reads as
 * part of the statistic instead of decoration beside it.
 *
 * House rules, same as the post artwork: `currentColor` only so both themes
 * work, no client JS, and every animation switched off under
 * `prefers-reduced-motion` with a static pose that still reads.
 */

export type StatIconName = "posts" | "reads" | "likes" | "subscribers";

const BOX = "0 0 24 24";

/** A page settling onto the stack behind it. */
function PostsIcon() {
	return (
		<svg viewBox={BOX} fill="none" aria-hidden className="stat-icon">
			<rect
				x="4"
				y="7"
				width="12"
				height="14"
				rx="2.5"
				stroke="currentColor"
				strokeOpacity="0.35"
				strokeWidth="1.5"
			/>
			<g className="stat-posts-top">
				<rect
					x="8"
					y="3"
					width="12"
					height="14"
					rx="2.5"
					stroke="currentColor"
					strokeWidth="1.5"
					fill="hsl(var(--card))"
				/>
				<path
					d="M11 8h6M11 11h6M11 14h3.5"
					stroke="currentColor"
					strokeOpacity="0.55"
					strokeWidth="1.5"
					strokeLinecap="round"
				/>
			</g>
		</svg>
	);
}

/** An eye whose pupil looks around, then settles. */
function ReadsIcon() {
	return (
		<svg viewBox={BOX} fill="none" aria-hidden className="stat-icon">
			<path
				d="M2 12s3.8-6.5 10-6.5S22 12 22 12s-3.8 6.5-10 6.5S2 12 2 12Z"
				stroke="currentColor"
				strokeWidth="1.5"
				strokeLinejoin="round"
			/>
			<circle
				cx="12"
				cy="12"
				r="3"
				stroke="currentColor"
				strokeOpacity="0.5"
				strokeWidth="1.5"
			/>
			<circle cx="12" cy="12" r="1.5" fill="currentColor" className="stat-pupil" />
		</svg>
	);
}

/** A heart with a real double beat, not a single pulse. */
function LikesIcon() {
	return (
		<svg viewBox={BOX} fill="none" aria-hidden className="stat-icon">
			<path
				d="M12 20.5S3.5 15.4 3.5 9.7a4.7 4.7 0 0 1 8.5-2.8 4.7 4.7 0 0 1 8.5 2.8c0 5.7-8.5 10.8-8.5 10.8Z"
				stroke="currentColor"
				strokeWidth="1.5"
				strokeLinejoin="round"
				className="stat-heart"
			/>
		</svg>
	);
}

/** Two figures, and a third arriving behind them. */
function SubscribersIcon() {
	return (
		<svg viewBox={BOX} fill="none" aria-hidden className="stat-icon">
			<circle cx="9" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.5" />
			<path
				d="M3.5 19.5c0-3 2.5-5 5.5-5s5.5 2 5.5 5"
				stroke="currentColor"
				strokeWidth="1.5"
				strokeLinecap="round"
			/>
			<g className="stat-joiner">
				<circle
					cx="16.8"
					cy="9.2"
					r="2.4"
					stroke="currentColor"
					strokeOpacity="0.6"
					strokeWidth="1.5"
				/>
				<path
					d="M13.8 18.6c0-2.3 1.6-3.9 3.6-3.9s3.1 1.2 3.1 3.2"
					stroke="currentColor"
					strokeOpacity="0.6"
					strokeWidth="1.5"
					strokeLinecap="round"
				/>
			</g>
		</svg>
	);
}

const ICONS: Record<StatIconName, () => React.ReactElement> = {
	posts: PostsIcon,
	reads: ReadsIcon,
	likes: LikesIcon,
	subscribers: SubscribersIcon,
};

export function StatIcon({ name }: { name: StatIconName }) {
	const Icon = ICONS[name];
	return <Icon />;
}
