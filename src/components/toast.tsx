"use client";

import { cn } from "@/lib/utils";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { AlertCircle, Check, Info, X } from "lucide-react";
import { useIsHydrated } from "@/lib/visitor";
import {
	createContext,
	useCallback,
	useContext,
	useMemo,
	useState,
} from "react";
import { createPortal } from "react-dom";

/** Monotonic, so two toasts fired in the same millisecond cannot collide. */
let idCounter = 0;

/**
 * A very small toast system, hand-rolled rather than pulled from a library.
 *
 * Every off-the-shelf toast ships an opinionated palette: green for success,
 * red for error, blue for info. This site is strictly achromatic, so adopting
 * one would mean overriding its colours everywhere and still fighting it on
 * every upgrade. Tone is carried by an icon and a hairline accent instead, the
 * same way the rest of the UI carries hierarchy without hue.
 */

type Tone = "success" | "error" | "info";

export type Toast = {
	id: number;
	tone: Tone;
	title: string;
	description?: string;
};

type ToastInput = Omit<Toast, "id">;

const ToastContext = createContext<{
	toast: (t: ToastInput) => void;
} | null>(null);

/** Long enough to read two lines without being in the way. */
const DURATION = 5000;

const ICONS: Record<Tone, typeof Check> = {
	success: Check,
	error: AlertCircle,
	info: Info,
};

export function useToast() {
	const ctx = useContext(ToastContext);
	if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
	return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
	const [toasts, setToasts] = useState<Toast[]>([]);

	// Portals need a DOM. Rendering nothing on the first pass keeps the markup
	// the server sent and the markup React expects identical. Read through an
	// external store rather than set in an effect, which would cost every page
	// an extra render pass on mount.
	const mounted = useIsHydrated();

	const dismiss = useCallback((id: number) => {
		setToasts((prev) => prev.filter((t) => t.id !== id));
	}, []);

	const toast = useCallback(
		(input: ToastInput) => {
			const id = ++idCounter;
			setToasts((prev) => [...prev, { ...input, id }]);
			window.setTimeout(() => dismiss(id), DURATION);
		},
		[dismiss]
	);

	const value = useMemo(() => ({ toast }), [toast]);

	return (
		<ToastContext.Provider value={value}>
			{children}
			{mounted &&
				createPortal(
					<Viewport toasts={toasts} onDismiss={dismiss} />,
					document.body
				)}
		</ToastContext.Provider>
	);
}

function Viewport({
	toasts,
	onDismiss,
}: {
	toasts: Toast[];
	onDismiss: (id: number) => void;
}) {
	return (
		<div
			// Top right, below the sticky header so it never covers the nav.
			className="pointer-events-none fixed right-4 top-20 z-[100] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-2 sm:right-6 sm:top-24"
			role="region"
			aria-label="Notifications"
		>
			<AnimatePresence initial={false} mode="popLayout">
				{toasts.map((t) => (
					<ToastCard key={t.id} toast={t} onDismiss={onDismiss} />
				))}
			</AnimatePresence>
		</div>
	);
}

function ToastCard({
	toast,
	onDismiss,
}: {
	toast: Toast;
	onDismiss: (id: number) => void;
}) {
	const reduced = useReducedMotion();
	const Icon = ICONS[toast.tone];

	return (
		<motion.div
			layout
			// Slides in from the right edge it is anchored to. Under reduced
			// motion it simply fades, rather than not appearing at all.
			initial={reduced ? { opacity: 0 } : { opacity: 0, x: 24, scale: 0.97 }}
			animate={reduced ? { opacity: 1 } : { opacity: 1, x: 0, scale: 1 }}
			exit={reduced ? { opacity: 0 } : { opacity: 0, x: 16, scale: 0.97 }}
			transition={{ type: "spring", stiffness: 420, damping: 34, mass: 0.7 }}
			role="status"
			aria-live={toast.tone === "error" ? "assertive" : "polite"}
			className={cn(
				"pointer-events-auto relative overflow-hidden rounded-xl border border-border bg-card p-4 pr-10",
				"shadow-[0_1px_2px_rgba(0,0,0,0.04),0_12px_32px_-12px_rgba(0,0,0,0.18)]",
				"dark:shadow-[0_1px_2px_rgba(0,0,0,0.4),0_12px_32px_-12px_rgba(0,0,0,0.7)]"
			)}
		>
			{/* Hairline accent. Weight, not hue, marks an error as louder. */}
			<span
				aria-hidden
				className={cn(
					"absolute inset-y-0 left-0 w-0.5",
					toast.tone === "error" ? "bg-foreground" : "bg-border"
				)}
			/>

			<div className="flex items-start gap-3">
				<span
					aria-hidden
					className={cn(
						"mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full",
						toast.tone === "success"
							? "bg-foreground text-background"
							: "border border-border text-muted-foreground"
					)}
				>
					<Icon className="size-3" strokeWidth={2.5} />
				</span>

				<div className="min-w-0 flex-1">
					<p className="text-base font-semibold leading-snug text-foreground">
						{toast.title}
					</p>
					{toast.description && (
						<p className="mt-1 text-[14px] leading-relaxed text-muted-foreground">
							{toast.description}
						</p>
					)}
				</div>
			</div>

			<button
				type="button"
				onClick={() => onDismiss(toast.id)}
				aria-label="Dismiss notification"
				className="absolute right-2.5 top-2.5 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
			>
				<X className="size-3.5" />
			</button>

			{/* Time remaining, drawn as a receding hairline along the bottom. */}
			{!reduced && (
				<motion.span
					aria-hidden
					initial={{ scaleX: 1 }}
					animate={{ scaleX: 0 }}
					transition={{ duration: DURATION / 1000, ease: "linear" }}
					className="absolute inset-x-0 bottom-0 h-px origin-left bg-border"
				/>
			)}
		</motion.div>
	);
}
