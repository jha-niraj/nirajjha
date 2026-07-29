"use client";

import { cn } from "@/lib/utils";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import * as React from "react";

/**
 * Dialog on Radix. Radix handles the parts that are easy to get wrong by hand:
 * focus trapping, returning focus to the trigger on close, Escape, scroll lock,
 * and the aria wiring between title, description and the panel.
 *
 * Animation is CSS keyed off Radix's `data-state`, not framer-motion, because
 * Radix unmounts the content immediately on close and would cut an exit
 * animation short. The keyframes live in globals.css under "Dialog".
 */

const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogClose = DialogPrimitive.Close;
const DialogPortal = DialogPrimitive.Portal;

const DialogOverlay = React.forwardRef<
	React.ElementRef<typeof DialogPrimitive.Overlay>,
	React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
	<DialogPrimitive.Overlay
		ref={ref}
		className={cn(
			"fixed inset-0 z-50 bg-background/70 backdrop-blur-sm",
			"data-[state=open]:animate-dialog-overlay-in",
			"data-[state=closed]:animate-dialog-overlay-out",
			className
		)}
		{...props}
	/>
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

const DialogContent = React.forwardRef<
	React.ElementRef<typeof DialogPrimitive.Content>,
	React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
		/** Hides the built-in close button when the panel supplies its own. */
		hideClose?: boolean;
	}
>(({ className, children, hideClose, ...props }, ref) => (
	<DialogPortal>
		<DialogOverlay />
		<DialogPrimitive.Content
			ref={ref}
			className={cn(
				"fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2",
				"rounded-2xl border border-border bg-card p-6 sm:p-8",
				"shadow-[0_2px_8px_rgba(0,0,0,0.04),0_24px_64px_-24px_rgba(0,0,0,0.28)]",
				"dark:shadow-[0_2px_8px_rgba(0,0,0,0.5),0_24px_64px_-24px_rgba(0,0,0,0.8)]",
				"data-[state=open]:animate-dialog-in",
				"data-[state=closed]:animate-dialog-out",
				className
			)}
			{...props}
		>
			{children}
			{!hideClose && (
				<DialogPrimitive.Close
					className="absolute right-4 top-4 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
					aria-label="Close"
				>
					<X className="size-4" />
				</DialogPrimitive.Close>
			)}
		</DialogPrimitive.Content>
	</DialogPortal>
));
DialogContent.displayName = DialogPrimitive.Content.displayName;

const DialogTitle = React.forwardRef<
	React.ElementRef<typeof DialogPrimitive.Title>,
	React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
	<DialogPrimitive.Title
		ref={ref}
		className={cn(
			"text-xl font-semibold tracking-tight text-foreground",
			className
		)}
		{...props}
	/>
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef<
	React.ElementRef<typeof DialogPrimitive.Description>,
	React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
	<DialogPrimitive.Description
		ref={ref}
		className={cn(
			"text-sm leading-relaxed text-muted-foreground",
			className
		)}
		{...props}
	/>
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

export {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogOverlay,
	DialogPortal,
	DialogTitle,
	DialogTrigger,
};
