"use client";

import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { Maximize2, Minus, Plus, Scan, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
	TransformComponent,
	TransformWrapper,
	type ReactZoomPanPinchRef,
} from "react-zoom-pan-pinch";

/**
 * A mermaid diagram in a pan-and-zoom viewport, with a full-screen mode.
 *
 * Built on react-zoom-pan-pinch rather than by hand. The previous version was
 * my own transform maths and it got the two things that actually matter wrong:
 * centring the diagram on load, and keeping the zoom anchored where the cursor
 * is. Those are exactly the parts a library has already solved, including pinch
 * on touch and momentum, so this now only owns the chrome.
 *
 * The SVG is handed in as an HTML string because mermaid renders it after the
 * article HTML has already been injected; there is no React element to adopt.
 */

const ZOOM_STEP = 0.3;
const MIN_SCALE = 0.3;
const MAX_SCALE = 5;

function Controls({
	api,
	isFull,
	onToggleFull,
}: {
	api: React.RefObject<ReactZoomPanPinchRef | null>;
	isFull: boolean;
	onToggleFull: () => void;
}) {
	const buttons = [
		{
			label: "Zoom in",
			icon: Plus,
			run: () => api.current?.zoomIn(ZOOM_STEP),
		},
		{
			label: "Zoom out",
			icon: Minus,
			run: () => api.current?.zoomOut(ZOOM_STEP),
		},
		{
			label: "Fit to view",
			icon: Scan,
			// centerView rather than resetTransform: reset returns to scale 1,
			// which for a wide diagram means it hangs off both edges again.
			run: () => api.current?.centerView(undefined, 260, "easeOut"),
		},
		{
			label: isFull ? "Exit full screen" : "Open full screen",
			icon: isFull ? X : Maximize2,
			run: onToggleFull,
		},
	];

	return (
		<div className="absolute bottom-3.5 left-3.5 z-10 flex flex-col overflow-hidden rounded-lg border border-border bg-background shadow-[0_1px_2px_rgba(0,0,0,0.06),0_8px_24px_-12px_rgba(0,0,0,0.25)]">
			{buttons.map(({ label, icon: Icon, run }) => (
				<Tooltip key={label}>
					<TooltipTrigger asChild>
						<button
							type="button"
							onClick={run}
							aria-label={label}
							className="flex size-8 items-center justify-center border-b border-border text-muted-foreground transition-colors last:border-b-0 hover:bg-muted hover:text-foreground"
						>
							<Icon className="size-[0.95rem]" />
						</button>
					</TooltipTrigger>
					<TooltipContent side="right">{label}</TooltipContent>
				</Tooltip>
			))}
		</div>
	);
}

function Canvas({
	svg,
	isFull,
	onToggleFull,
}: {
	svg: string;
	isFull: boolean;
	onToggleFull: () => void;
}) {
	const api = useRef<ReactZoomPanPinchRef>(null);

	// Centre once the SVG has been laid out. Without the frame delay the
	// wrapper measures a zero-width child and centres on nothing.
	const centre = useCallback(() => {
		requestAnimationFrame(() => api.current?.centerView(undefined, 0));
	}, []);

	// Two passes: once on mount, and once after the overlay's 240ms entrance
	// has settled. Centring against a box that is still scaling puts the
	// diagram slightly off, and the second pass is imperceptible.
	useEffect(() => {
		centre();
		const t = window.setTimeout(centre, 300);
		return () => window.clearTimeout(t);
	}, [centre, isFull]);

	return (
		<TransformWrapper
			ref={api}
			minScale={MIN_SCALE}
			maxScale={MAX_SCALE}
			centerOnInit
			limitToBounds={false}
			doubleClick={{ mode: "reset", animationTime: 260 }}
			// Plain wheel scrolls the page; a diagram that swallowed it would trap
			// the reader every time they scrolled past one.
			wheel={{ step: 0.12, activationKeys: ["Control", "Meta"] }}
			panning={{ velocityDisabled: false }}
			onInit={centre}
		>
			<Controls api={api} isFull={isFull} onToggleFull={onToggleFull} />
			<TransformComponent
				wrapperClass="diagram-viewport"
				contentClass="diagram-content"
			>
				<div
					className="diagram-svg"
					// mermaid's own output, generated from the post's source at build
					// time. No user input reaches it.
					dangerouslySetInnerHTML={{ __html: svg }}
				/>
			</TransformComponent>
		</TransformWrapper>
	);
}

export function DiagramFigure({
	svg,
	className,
}: {
	svg: string;
	className?: string;
}) {
	const [isFull, setIsFull] = useState(false);

	// Escape closes, and the page behind must not scroll while it is open.
	useEffect(() => {
		if (!isFull) return;
		function onKey(e: KeyboardEvent) {
			if (e.key === "Escape") setIsFull(false);
		}
		const previous = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		window.addEventListener("keydown", onKey);
		return () => {
			document.body.style.overflow = previous;
			window.removeEventListener("keydown", onKey);
		};
	}, [isFull]);

	return (
		// Its own provider. Each figure is mounted into the article with
		// `createRoot`, which makes it a separate React tree: the
		// TooltipProvider in the root layout is in a different tree entirely and
		// its context does not reach here, so the tooltips threw
		// "`Tooltip` must be used within `TooltipProvider`".
		<TooltipProvider delayDuration={200}>
			{/*
			  The frame always keeps its space in the article, but the canvas
			  moves into the overlay when full screen opens rather than being
			  duplicated.

			  Rendering the same mermaid markup twice was the bug: mermaid bakes
			  ids into its own <defs> (arrowheads, markers) and refers to them
			  with url(#id). Two copies in one document means duplicate ids, the
			  second copy's references resolve to the first, and the full-screen
			  diagram came up blank.
			*/}
			<div className={cn("diagram-frame", className)}>
				{!isFull && (
					<Canvas svg={svg} isFull={false} onToggleFull={() => setIsFull(true)} />
				)}
				{isFull && (
					<div className="flex h-full items-center justify-center">
						<p className="text-xs text-muted-foreground">
							Open in full screen
						</p>
					</div>
				)}
			</div>

			<AnimatePresence>
				{isFull && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.18 }}
						className="fixed inset-0 z-[80] bg-background/95 backdrop-blur-sm"
						role="dialog"
						aria-modal="true"
						aria-label="Diagram, full screen"
					>
						<motion.div
							initial={{ opacity: 0, scale: 0.97 }}
							animate={{ opacity: 1, scale: 1 }}
							exit={{ opacity: 0, scale: 0.98 }}
							transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
							className="diagram-frame diagram-frame-full absolute inset-3 sm:inset-6"
						>
							{/* Keyed so the wrapper mounts fresh at the overlay's size.
							    Reusing the instance would leave it centred against the
							    old, much smaller box. */}
							<Canvas
								key="full"
								svg={svg}
								isFull
								onToggleFull={() => setIsFull(false)}
							/>
						</motion.div>
					</motion.div>
				)}
			</AnimatePresence>
		</TooltipProvider>
	);
}
