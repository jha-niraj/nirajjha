/**
 * The 404 illustration: a request that runs out of road.
 *
 * Three resolved segments sit on a rail, a probe walks them in order, and where
 * the fourth should be there is only an outline. The probe reaches the break,
 * stalls, and scatters. It depicts the actual failure rather than decorating
 * the page: something was looked up, the lookup got most of the way, and then
 * there was nothing there.
 *
 * Same rules as `post-art.tsx`: pure SVG plus CSS keyframes in globals.css, no
 * client JS, `currentColor` only so it works in both themes, and every
 * animation switched off under `prefers-reduced-motion` with a static pose that
 * still reads (the probe parks at the gap).
 */
export function NotFoundArt() {
	/** Centres of the segments that did resolve. */
	const NODES = [56, 136, 216];
	/** Where the rail gives out, and where the probe dies. */
	const BREAK = 216;
	/** Sparks thrown off at the break. Each gets its own vector. */
	const SPARKS = [
		{ dx: 26, dy: -20 },
		{ dx: 32, dy: 4 },
		{ dx: 22, dy: 22 },
	];

	return (
		<svg
			viewBox="0 0 360 200"
			fill="none"
			role="img"
			aria-label="A path of resolved segments ending at a gap where the next one should be"
			className="not-found-art"
		>
			<defs>
				<pattern
					id="nf-grid"
					width="18"
					height="18"
					patternUnits="userSpaceOnUse"
				>
					<circle cx="1" cy="1" r="1" fill="currentColor" opacity="0.1" />
				</pattern>
			</defs>

			<rect width="360" height="200" fill="url(#nf-grid)" />

			{/* The stretch that resolved. Draws itself once, left to right. */}
			<path
				d={`M${NODES[0]} 110 H${BREAK}`}
				stroke="currentColor"
				strokeOpacity="0.3"
				strokeWidth="1.5"
				className="nf-rail"
			/>

			{/* Past the last real segment the rail frays: longer gaps, less ink. */}
			<path
				d={`M${BREAK} 110 H252`}
				stroke="currentColor"
				strokeOpacity="0.24"
				strokeWidth="1.5"
				strokeDasharray="6 7"
			/>
			<path
				d="M252 110 H292"
				stroke="currentColor"
				strokeOpacity="0.15"
				strokeWidth="1.5"
				strokeDasharray="4 10"
			/>
			<path
				d="M292 110 H330"
				stroke="currentColor"
				strokeOpacity="0.08"
				strokeWidth="1.5"
				strokeDasharray="2 12"
			/>

			{NODES.map((x, i) => (
				<g key={x} className="nf-node" style={{ ["--i" as string]: i }}>
					<rect
						x={x - 17}
						y={93}
						width="34"
						height="34"
						rx="10"
						stroke="currentColor"
						strokeOpacity="0.4"
						strokeWidth="1.5"
					/>
					<circle cx={x} cy={110} r="3" fill="currentColor" fillOpacity="0.55" />
				</g>
			))}

			{/* The segment that was asked for and is not there. */}
			<g className="nf-ghost">
				<rect
					x={294}
					y={93}
					width="34"
					height="34"
					rx="10"
					stroke="currentColor"
					strokeWidth="1.5"
					strokeDasharray="5 5"
				/>
				<path
					d="M305 104 L317 116 M317 104 L305 116"
					stroke="currentColor"
					strokeWidth="1.5"
					strokeLinecap="round"
				/>
			</g>

			{/* The probe. Starts at the first segment, dies at the break. */}
			<circle
				cx={NODES[0]}
				cy="110"
				r="4.5"
				fill="currentColor"
				className="nf-probe"
			/>

			<g className="nf-sparks">
				{SPARKS.map((s, i) => (
					<circle
						key={i}
						cx={BREAK}
						cy="110"
						r="2"
						fill="currentColor"
						className="nf-spark"
						style={{
							["--dx" as string]: `${s.dx}px`,
							["--dy" as string]: `${s.dy}px`,
							["--i" as string]: i,
						}}
					/>
				))}
			</g>
		</svg>
	);
}
