import { cn } from "@/lib/utils";

/**
 * Animated SVG artwork, one per post, instead of a photograph.
 *
 * A post declares which one it wants with `art:` in its frontmatter. Each piece
 * is meant to *depict the subject*: the pipeline piece moves a token through
 * stages and drops the unsafe one to human review, the retrieval piece pulls
 * chunks out of a document into a query, and so on.
 *
 * Everything is pure SVG plus CSS keyframes (defined under `.post-art` in
 * globals.css). No client JS, no images, so a card costs nothing to load and
 * the art inherits `currentColor` in both themes. The keyframes are all gated
 * behind `prefers-reduced-motion`, so the art holds a sensible static pose for
 * anyone who asked for less movement.
 */

export type ArtKind =
	| "pipeline"
	| "retrieval"
	| "schema"
	| "network"
	| "terminal";

const VIEWBOX = "0 0 320 180";

/* -------------------------------------------------------------------------- */

/** Stages with a token flowing through, plus a branch to human review. */
function Pipeline() {
	return (
		<svg viewBox={VIEWBOX} fill="none" aria-hidden className="post-art-svg">
			{/* main rail */}
			<path
				d="M40 70 H280"
				stroke="currentColor"
				strokeOpacity="0.18"
				strokeWidth="1.5"
			/>
			{/* review branch */}
			<path
				d="M190 70 V118 H262"
				stroke="currentColor"
				strokeOpacity="0.18"
				strokeWidth="1.5"
				strokeDasharray="4 4"
			/>

			{[40, 115, 190, 265].map((x, i) => (
				<g key={x} className="post-art-node" style={{ ["--i" as string]: i }}>
					<rect
						x={x - 17}
						y={53}
						width="34"
						height="34"
						rx="9"
						stroke="currentColor"
						strokeOpacity="0.35"
						strokeWidth="1.5"
					/>
					<rect
						x={x - 17}
						y={53}
						width="34"
						height="34"
						rx="9"
						fill="currentColor"
						className="post-art-node-fill"
					/>
				</g>
			))}

			{/* human review node */}
			<g className="post-art-node" style={{ ["--i" as string]: 4 }}>
				<rect
					x={245}
					y={101}
					width="34"
					height="34"
					rx="17"
					stroke="currentColor"
					strokeOpacity="0.35"
					strokeWidth="1.5"
				/>
				<circle cx={262} cy={112} r="4.5" fill="currentColor" opacity="0.55" />
				<path
					d="M253 126c2.6-4.2 5.9-6.3 9-6.3s6.4 2.1 9 6.3"
					stroke="currentColor"
					strokeOpacity="0.55"
					strokeWidth="1.5"
					strokeLinecap="round"
				/>
			</g>

			{/* the token making its way down the rail */}
			<circle cx="0" cy="70" r="4" fill="currentColor" className="post-art-token" />
			<circle
				cx="0"
				cy="70"
				r="4"
				fill="currentColor"
				className="post-art-token post-art-token-2"
			/>
		</svg>
	);
}

/** A document shedding chunks that converge into a single answer. */
function Retrieval() {
	const chunks = [
		{ x: 46, y: 44 },
		{ x: 46, y: 68 },
		{ x: 46, y: 92 },
		{ x: 46, y: 116 },
	];

	return (
		<svg viewBox={VIEWBOX} fill="none" aria-hidden className="post-art-svg">
			<rect
				x="34"
				y="32"
				width="76"
				height="116"
				rx="8"
				stroke="currentColor"
				strokeOpacity="0.3"
				strokeWidth="1.5"
			/>

			{chunks.map((c, i) => (
				<rect
					key={i}
					x={c.x}
					y={c.y}
					width="52"
					height="12"
					rx="3"
					fill="currentColor"
					className="post-art-chunk"
					style={{ ["--i" as string]: i }}
				/>
			))}

			{chunks.map((c, i) => (
				<path
					key={`l${i}`}
					d={`M${c.x + 60} ${c.y + 6} C 160 ${c.y + 6}, 180 90, 236 90`}
					stroke="currentColor"
					strokeWidth="1.25"
					className="post-art-trace"
					style={{ ["--i" as string]: i }}
				/>
			))}

			<circle
				cx="252"
				cy="90"
				r="22"
				stroke="currentColor"
				strokeOpacity="0.35"
				strokeWidth="1.5"
			/>
			<circle
				cx="252"
				cy="90"
				r="8"
				fill="currentColor"
				className="post-art-pulse"
			/>
		</svg>
	);
}

/** Entity boxes with relations drawing themselves between them. */
function Schema() {
	const tables = [
		{ x: 30, y: 30, rows: 3 },
		{ x: 196, y: 24, rows: 2 },
		{ x: 178, y: 106, rows: 3 },
	];

	return (
		<svg viewBox={VIEWBOX} fill="none" aria-hidden className="post-art-svg">
			{[
				"M124 54 H196",
				"M124 78 C 150 78, 152 128, 178 128",
			].map((d, i) => (
				<path
					key={d}
					d={d}
					stroke="currentColor"
					strokeWidth="1.5"
					className="post-art-draw"
					style={{ ["--i" as string]: i }}
				/>
			))}

			{tables.map((t, ti) => (
				<g key={ti} className="post-art-node" style={{ ["--i" as string]: ti }}>
					<rect
						x={t.x}
						y={t.y}
						width="94"
						height={26 + t.rows * 18}
						rx="7"
						stroke="currentColor"
						strokeOpacity="0.32"
						strokeWidth="1.5"
					/>
					<rect
						x={t.x}
						y={t.y}
						width="94"
						height="24"
						rx="7"
						fill="currentColor"
						opacity="0.14"
					/>
					{Array.from({ length: t.rows }).map((_, r) => (
						<rect
							key={r}
							x={t.x + 12}
							y={t.y + 34 + r * 18}
							width={r % 2 ? 44 : 62}
							height="7"
							rx="3.5"
							fill="currentColor"
							className="post-art-chunk"
							style={{ ["--i" as string]: ti * 3 + r }}
						/>
					))}
				</g>
			))}
		</svg>
	);
}

/** Nodes with links firing between them. */
function Network() {
	const nodes = [
		{ x: 60, y: 52 },
		{ x: 160, y: 34 },
		{ x: 258, y: 66 },
		{ x: 108, y: 128 },
		{ x: 214, y: 140 },
	];
	const links: [number, number][] = [
		[0, 1],
		[1, 2],
		[0, 3],
		[3, 4],
		[4, 2],
		[1, 3],
	];

	return (
		<svg viewBox={VIEWBOX} fill="none" aria-hidden className="post-art-svg">
			{links.map(([a, b], i) => (
				<line
					key={i}
					x1={nodes[a].x}
					y1={nodes[a].y}
					x2={nodes[b].x}
					y2={nodes[b].y}
					stroke="currentColor"
					strokeWidth="1.25"
					className="post-art-link"
					style={{ ["--i" as string]: i }}
				/>
			))}
			{nodes.map((n, i) => (
				<g key={i}>
					<circle
						cx={n.x}
						cy={n.y}
						r="12"
						stroke="currentColor"
						strokeOpacity="0.3"
						strokeWidth="1.5"
					/>
					<circle
						cx={n.x}
						cy={n.y}
						r="5"
						fill="currentColor"
						className="post-art-pulse"
						style={{ ["--i" as string]: i }}
					/>
				</g>
			))}
		</svg>
	);
}

/** A window with lines typing themselves out under a blinking caret. */
function Terminal() {
	const lines = [70, 118, 92, 142, 104];

	return (
		<svg viewBox={VIEWBOX} fill="none" aria-hidden className="post-art-svg">
			<rect
				x="34"
				y="26"
				width="252"
				height="128"
				rx="10"
				stroke="currentColor"
				strokeOpacity="0.3"
				strokeWidth="1.5"
			/>
			<path
				d="M34 50 H286"
				stroke="currentColor"
				strokeOpacity="0.2"
				strokeWidth="1.5"
			/>
			{[48, 62, 76].map((cx) => (
				<circle key={cx} cx={cx} cy="38" r="3.5" fill="currentColor" opacity="0.3" />
			))}

			{lines.map((w, i) => (
				<rect
					key={i}
					x="52"
					y={66 + i * 17}
					width={w}
					height="7"
					rx="3.5"
					fill="currentColor"
					className="post-art-type"
					style={{ ["--i" as string]: i, ["--w" as string]: `${w}px` }}
				/>
			))}

			<rect
				x="52"
				y={66 + lines.length * 17}
				width="9"
				height="9"
				fill="currentColor"
				className="post-art-caret"
			/>
		</svg>
	);
}

/* -------------------------------------------------------------------------- */

const ART: Record<ArtKind, () => JSX.Element> = {
	pipeline: Pipeline,
	retrieval: Retrieval,
	schema: Schema,
	network: Network,
	terminal: Terminal,
};

export const ART_KINDS = Object.keys(ART) as ArtKind[];

/**
 * Picks a stable piece for a post that did not declare one, so an unset
 * `art:` still looks deliberate and does not change between renders.
 */
function fallbackFor(slug: string): ArtKind {
	let hash = 0;
	for (let i = 0; i < slug.length; i++) hash = (hash * 31 + slug.charCodeAt(i)) >>> 0;
	return ART_KINDS[hash % ART_KINDS.length];
}

export function PostArt({
	art,
	slug,
	className,
}: {
	art?: string;
	slug: string;
	className?: string;
}) {
	const kind: ArtKind =
		art && (ART_KINDS as string[]).includes(art)
			? (art as ArtKind)
			: fallbackFor(slug);

	const Piece = ART[kind];

	return (
		<div
			className={cn(
				"post-art relative flex h-full w-full items-center justify-center overflow-hidden bg-muted text-foreground",
				className
			)}
			data-art={kind}
		>
			{/* Faint grid so the art sits on a surface rather than floating. */}
			<div aria-hidden className="post-art-grid" />
			<Piece />
		</div>
	);
}
