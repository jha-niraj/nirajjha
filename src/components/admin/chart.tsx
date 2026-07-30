"use client";

import { cn } from "@/lib/utils";
import { useId, useState } from "react";

export type Point = { label: string; value: number };

/**
 * A line chart, hand-drawn as an SVG path.
 *
 * No charting library. Recharts is ~90kB gzipped and every dependency it pulls
 * renders on the client; this is one polyline, an area fill and a hover
 * readout, which is about sixty lines and no bundle cost. The moment this needs
 * axes, brushing or stacked series, swap it for a real library rather than
 * growing this one.
 *
 * Monochrome, like everything else: the fill is a gradient of `--foreground` at
 * low alpha rather than a colour.
 */
export function LineChart({
	points,
	height = 180,
	label = "value",
	className,
}: {
	points: Point[];
	height?: number;
	label?: string;
	className?: string;
}) {
	const gradientId = useId();
	const [hover, setHover] = useState<number | null>(null);

	if (points.length === 0) {
		return (
			<div
				className={cn(
					"flex items-center justify-center rounded-xl border border-dashed border-border text-sm text-muted-foreground",
					className
				)}
				style={{ height }}
			>
				Nothing recorded yet
			</div>
		);
	}

	const W = 100;
	const H = 40;
	const max = Math.max(...points.map((p) => p.value), 1);
	// A single point has no span to divide by, so it is pinned to the middle.
	const step = points.length > 1 ? W / (points.length - 1) : 0;

	const coords = points.map((p, i) => ({
		x: points.length > 1 ? i * step : W / 2,
		y: H - (p.value / max) * (H - 4) - 2,
	}));

	const line = coords
		.map((c, i) => `${i === 0 ? "M" : "L"}${c.x.toFixed(2)},${c.y.toFixed(2)}`)
		.join(" ");
	const area = `${line} L${coords[coords.length - 1].x.toFixed(2)},${H} L${coords[0].x.toFixed(2)},${H} Z`;

	const active = hover !== null ? points[hover] : points[points.length - 1];

	return (
		<div className={cn("rounded-xl border border-border bg-card p-4", className)}>
			<div className="flex items-baseline justify-between gap-3">
				<p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
					{active.label}
				</p>
				<p className="text-lg font-semibold tabular-nums">
					{active.value.toLocaleString()}
					<span className="ml-1.5 text-xs font-normal text-muted-foreground">
						{label}
					</span>
				</p>
			</div>

			<div className="relative mt-3" style={{ height }}>
				<svg
					viewBox={`0 0 ${W} ${H}`}
					preserveAspectRatio="none"
					className="h-full w-full overflow-visible"
					aria-hidden
				>
					<defs>
						<linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
							<stop offset="0%" stopColor="currentColor" stopOpacity="0.18" />
							<stop offset="100%" stopColor="currentColor" stopOpacity="0" />
						</linearGradient>
					</defs>

					<path d={area} fill={`url(#${gradientId})`} className="text-foreground" />
					<path
						d={line}
						fill="none"
						stroke="currentColor"
						strokeWidth="0.8"
						strokeLinecap="round"
						strokeLinejoin="round"
						vectorEffect="non-scaling-stroke"
						className="text-foreground"
					/>

					{hover !== null && (
						<circle
							cx={coords[hover].x}
							cy={coords[hover].y}
							r="1.4"
							fill="currentColor"
							vectorEffect="non-scaling-stroke"
							className="text-foreground"
						/>
					)}
				</svg>

				{/* Hover targets sit above the SVG as real elements: hit-testing a
				    stretched path is unreliable, and this also gives keyboard
				    users something focusable per point. */}
				<div className="absolute inset-0 flex">
					{points.map((p, i) => (
						<button
							key={`${p.label}-${i}`}
							type="button"
							onMouseEnter={() => setHover(i)}
							onFocus={() => setHover(i)}
							onMouseLeave={() => setHover(null)}
							onBlur={() => setHover(null)}
							aria-label={`${p.label}: ${p.value} ${label}`}
							className="h-full flex-1 rounded-sm outline-none focus-visible:bg-foreground/5"
						/>
					))}
				</div>
			</div>

			<div className="mt-2 flex justify-between text-[11px] text-muted-foreground">
				<span>{points[0].label}</span>
				<span>{points[points.length - 1].label}</span>
			</div>
		</div>
	);
}

/** Horizontal bars, for ranked comparisons where a line makes no sense. */
export function BarList({
	items,
	className,
}: {
	items: { label: string; value: number; href?: string }[];
	className?: string;
}) {
	const max = Math.max(...items.map((i) => i.value), 1);

	return (
		<ul className={cn("flex flex-col gap-2", className)}>
			{items.map((item) => (
				<li key={item.label} className="relative">
					<div className="relative overflow-hidden rounded-lg border border-border bg-card">
						<div
							aria-hidden
							className="absolute inset-y-0 left-0 bg-foreground/[0.07]"
							style={{ width: `${(item.value / max) * 100}%` }}
						/>
						<div className="relative flex items-center justify-between gap-3 px-3 py-2">
							<span className="truncate text-sm">{item.label}</span>
							<span className="shrink-0 text-sm font-semibold tabular-nums">
								{item.value.toLocaleString()}
							</span>
						</div>
					</div>
				</li>
			))}
		</ul>
	);
}
