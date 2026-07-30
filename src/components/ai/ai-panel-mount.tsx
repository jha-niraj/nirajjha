"use client";

import { AIPanel } from "@/components/ai/ai-panel";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import {
	AI_MAX_WIDTH,
	AI_MIN_WIDTH,
	useAIPanelStore,
} from "@/stores/ai-panel.store";

/** Breathing room between the page column and the docked rail, in px. */
const AI_GAP = 12;
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

/**
 * The docked reading assistant: a fixed right rail with a drag handle, and a
 * full-width overlay below `lg`.
 *
 * Not a Sheet on desktop. A Sheet is modal, and a modal assistant is the wrong
 * shape here: the whole point is to read the article and ask about it at the
 * same time, which means the article must stay scrollable and selectable while
 * the panel is open.
 *
 * The main column is pushed by `padding-right` on the page shell rather than by
 * a layout change here, so opening the panel never reflows the article's line
 * length mid-sentence.
 */
export function AIPanelMount({
	postTitles,
}: {
	/** slug -> title for every published post. */
	postTitles: Record<string, string>;
}) {
	// Derived from the URL rather than passed down, because this now lives in
	// the layout and must not be remounted when the page changes. A post page
	// is any path that is not one of the known static routes.
	const pathname = usePathname();
	const slug = pathname.replace(/^\//, "");
	const postTitle = postTitles[slug];
	const isPost = Boolean(postTitle);
	const isOpen = useAIPanelStore((s) => s.isOpen);
	const width = useAIPanelStore((s) => s.width);
	const setWidth = useAIPanelStore((s) => s.setWidth);
	const open = useAIPanelStore((s) => s.open);
	const setSlug = useAIPanelStore((s) => s.setSlug);

	const [isMobile, setIsMobile] = useState(false);
	const [isResizing, setIsResizing] = useState(false);
	const startX = useRef(0);
	const startWidth = useRef(width);

	// Zustand's persist rehydrates after the first paint, so the server and the
	// client disagree about `isOpen` for one frame. Rendering nothing until the
	// client has taken over avoids the hydration mismatch that causes.
	//
	// `useSyncExternalStore` rather than a `useState` + effect pair: it gives
	// React a separate server snapshot directly, instead of setting state inside
	// an effect and forcing a second render to correct the first one.
	const mounted = useSyncExternalStore(
		subscribeNever,
		() => true,
		() => false
	);

	// Scopes the thread to this post. `setSlug` clears the messages when the
	// slug actually changes, so an answer about one article can never be left
	// on screen while a different one is open.
	//
	// Guarded by a ref and written as a block: an arrow body would return
	// whatever the store setter returns, and React treats an effect's return
	// value as its cleanup function.
	const syncedSlug = useRef<string | null>(null);
	useEffect(() => {
		// Off a post, the thread is scoped to a sentinel so navigating between
		// the index and a post does not silently leave one post's answers on
		// screen while another is open.
		const scope = isPost ? slug : "__site__";
		if (syncedSlug.current === scope) return;
		syncedSlug.current = scope;
		setSlug(scope);
	}, [slug, isPost, setSlug]);

	// The shell reads this to inset its content, so the article is never hidden
	// underneath the panel. Set as a variable rather than a prop so nothing
	// between the layout and here has to thread the width down.
	useEffect(() => {
		const root = document.documentElement;
		root.style.setProperty(
			"--ai-panel-inset",
			isOpen && !isMobile ? `${width + AI_GAP * 2}px` : "0px"
		);
		return () => root.style.setProperty("--ai-panel-inset", "0px");
	}, [isOpen, isMobile, width]);

	useEffect(() => {
		const mq = window.matchMedia("(max-width: 1023px)");
		const apply = () => setIsMobile(mq.matches);
		apply();
		mq.addEventListener("change", apply);
		return () => mq.removeEventListener("change", apply);
	}, []);

	function onResizeStart(e: React.MouseEvent) {
		e.preventDefault();
		startX.current = e.clientX;
		startWidth.current = width;
		setIsResizing(true);

		function onMove(ev: MouseEvent) {
			// Dragging left widens the panel, so the delta is inverted.
			setWidth(startWidth.current + (startX.current - ev.clientX));
		}

		function onUp() {
			setIsResizing(false);
			document.removeEventListener("mousemove", onMove);
			document.removeEventListener("mouseup", onUp);
			document.body.style.cursor = "";
			document.body.style.userSelect = "";
		}

		document.addEventListener("mousemove", onMove);
		document.addEventListener("mouseup", onUp);
		// Without these the drag selects the article text it passes over.
		document.body.style.cursor = "col-resize";
		document.body.style.userSelect = "none";
	}

	function onHandleKeyDown(e: React.KeyboardEvent) {
		if (e.key === "ArrowLeft") setWidth(width + 24);
		if (e.key === "ArrowRight") setWidth(width - 24);
	}

	if (!mounted) return null;

	return (
		<>
			{/* Reopen affordance, only once the panel is dismissed. */}
			<AnimatePresence>
				{!isOpen && (
					<motion.div
						initial={{ opacity: 0, scale: 0.9 }}
						animate={{ opacity: 1, scale: 1 }}
						exit={{ opacity: 0, scale: 0.9 }}
						className="fixed bottom-24 right-5 z-[54] lg:bottom-8"
					>
						<Tooltip>
							<TooltipTrigger asChild>
								<button
									type="button"
									onClick={open}
									aria-label="Open reading assistant"
									className="flex size-11 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-lg transition-colors hover:border-foreground/30"
								>
									<Sparkles className="size-4" />
								</button>
							</TooltipTrigger>
							<TooltipContent side="left">Ask about this post</TooltipContent>
						</Tooltip>
					</motion.div>
				)}
			</AnimatePresence>

			<AnimatePresence>
				{isOpen && (
					<motion.aside
						key="ai-panel"
						initial={{ x: "100%" }}
						animate={{ x: 0 }}
						exit={{ x: "100%" }}
						transition={{ type: "spring", stiffness: 300, damping: 32 }}
						style={{ width: isMobile ? "100%" : width }}
						// z-[55] clears the floating dock. Anything layered inside the
						// panel (a Radix Select at z-50, for instance) has to be
						// re-checked against this, which is the trap the same pattern
						// in gurukulhq hit.
						className="fixed inset-y-0 right-0 z-[55] flex flex-col overflow-hidden border-l border-border bg-background shadow-2xl lg:inset-y-3 lg:right-3 lg:rounded-2xl lg:border"
						aria-label="Reading assistant"
					>
						{!isMobile && (
							<div
								role="separator"
								aria-orientation="vertical"
								aria-label="Resize panel"
								aria-valuenow={width}
								aria-valuemin={AI_MIN_WIDTH}
								aria-valuemax={AI_MAX_WIDTH}
								tabIndex={0}
								onMouseDown={onResizeStart}
								onKeyDown={onHandleKeyDown}
								className="group absolute inset-y-0 left-0 z-10 w-1.5 cursor-col-resize focus-visible:outline-none"
							>
								<span
									className={cnHandle(isResizing)}
									aria-hidden
								/>
							</div>
						)}

						<AIPanel slug={slug} postTitle={postTitle} isPost={isPost} />
					</motion.aside>
				)}
			</AnimatePresence>
		</>
	);
}

/** Client/server split never changes after hydration, so there is nothing to
 *  subscribe to. */
function subscribeNever() {
	return () => {};
}

/** Grab indicator: invisible until the handle is hovered, focused or dragging. */
function cnHandle(isResizing: boolean) {
	return [
		"absolute left-0 top-1/2 h-10 w-1 -translate-y-1/2 rounded-full bg-border",
		"transition-opacity",
		isResizing
			? "opacity-100"
			: "opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100",
	].join(" ");
}
