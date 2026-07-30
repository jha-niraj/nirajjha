"use client";

import { useAIPanelStore } from "@/stores/ai-panel.store";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { getScrollRoot } from "@/lib/scroll-root";
import { useEffect, useState } from "react";

type Anchor = { x: number; y: number; text: string };

const MIN_SELECTION = 12;
const MAX_QUOTE = 1200;

/**
 * The "Ask about this" button that appears over a selection inside the article.
 *
 * This is the feature that makes the panel worth having. An empty chat box asks
 * the reader to formulate a question from nothing; a selection means the
 * question is already scoped to the paragraph that confused them, and the panel
 * opens with the passage attached.
 *
 * Scoped to the article element so selecting text in the comments or the
 * contents rail does nothing.
 */
export function AskSelection({ rootId }: { rootId: string }) {
	const [anchor, setAnchor] = useState<Anchor | null>(null);
	const open = useAIPanelStore((s) => s.open);
	const setPendingQuote = useAIPanelStore((s) => s.setPendingQuote);

	useEffect(() => {
		function onSelectionSettled() {
			const selection = window.getSelection();
			if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
				setAnchor(null);
				return;
			}

			const text = selection.toString().trim();
			if (text.length < MIN_SELECTION) {
				setAnchor(null);
				return;
			}

			const root = document.getElementById(rootId);
			const range = selection.getRangeAt(0);
			if (!root || !root.contains(range.commonAncestorContainer)) {
				setAnchor(null);
				return;
			}

			const rect = range.getBoundingClientRect();
			const scroller = getScrollRoot();
			const box = scroller?.getBoundingClientRect();
			setAnchor({
				// Relative to the scroller's content, so the button travels with
				// the text rather than staying pinned to the window.
				x: rect.left + rect.width / 2 - (box?.left ?? 0) + (scroller?.scrollLeft ?? 0),
				y: rect.top - (box?.top ?? 0) + (scroller?.scrollTop ?? 0),
				text: text.slice(0, MAX_QUOTE),
			});
		}

		// `mouseup` rather than `selectionchange`: the latter fires on every
		// character as a drag grows, which makes the button jitter across the
		// screen while you are still selecting.
		document.addEventListener("mouseup", onSelectionSettled);
		document.addEventListener("keyup", onSelectionSettled);
		return () => {
			document.removeEventListener("mouseup", onSelectionSettled);
			document.removeEventListener("keyup", onSelectionSettled);
		};
	}, [rootId]);

	function ask() {
		if (!anchor) return;
		setPendingQuote(anchor.text);
		open();
		setAnchor(null);
		window.getSelection()?.removeAllRanges();
	}

	return (
		<AnimatePresence>
			{anchor && (
				<motion.button
					type="button"
					initial={{ opacity: 0, y: 4, scale: 0.94 }}
					animate={{ opacity: 1, y: 0, scale: 1 }}
					exit={{ opacity: 0, y: 4, scale: 0.94 }}
					transition={{ duration: 0.14, ease: [0.22, 1, 0.36, 1] }}
					// mousedown would clear the selection before the click lands.
					onMouseDown={(e) => e.preventDefault()}
					onClick={ask}
					style={{ left: anchor.x, top: anchor.y }}
					className="absolute z-40 -translate-x-1/2 -translate-y-[calc(100%+8px)] inline-flex items-center gap-1.5 rounded-full bg-foreground px-3 py-1.5 text-xs font-semibold text-background shadow-lg"
				>
					<Sparkles className="size-3" />
					Ask about this
				</motion.button>
			)}
		</AnimatePresence>
	);
}
