"use client";

import * as SheetPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

const Sheet = SheetPrimitive.Root;
const SheetTrigger = SheetPrimitive.Trigger;
const SheetClose = SheetPrimitive.Close;
const SheetPortal = SheetPrimitive.Portal;

const SheetOverlay = React.forwardRef<
	React.ComponentRef<typeof SheetPrimitive.Overlay>,
	React.ComponentPropsWithoutRef<typeof SheetPrimitive.Overlay>
>(({ className, ...props }, ref) => (
	<SheetPrimitive.Overlay
		ref={ref}
		className={cn(
			"fixed inset-0 z-[60] bg-background/70 backdrop-blur-sm",
			"data-[state=open]:animate-dialog-overlay-in",
			"data-[state=closed]:animate-dialog-overlay-out",
			className
		)}
		{...props}
	/>
));
SheetOverlay.displayName = SheetPrimitive.Overlay.displayName;

const SheetContent = React.forwardRef<
	React.ComponentRef<typeof SheetPrimitive.Content>,
	React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content> & {
		hideClose?: boolean;
	}
>(({ className, children, hideClose, ...props }, ref) => (
	<SheetPortal>
		<SheetOverlay />
		<SheetPrimitive.Content
			ref={ref}
			className={cn(
				"fixed inset-y-0 right-0 z-[61] flex w-full flex-col bg-background shadow-2xl",
				"sm:inset-y-3 sm:right-3 sm:max-w-xl sm:rounded-2xl sm:border sm:border-border",
				"data-[state=open]:animate-sheet-in data-[state=closed]:animate-sheet-out",
				className
			)}
			{...props}
		>
			{children}
			{!hideClose && (
				<SheetPrimitive.Close
					className="absolute right-4 top-4 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
					aria-label="Close"
				>
					<X className="size-4" />
				</SheetPrimitive.Close>
			)}
		</SheetPrimitive.Content>
	</SheetPortal>
));
SheetContent.displayName = SheetPrimitive.Content.displayName;

const SheetHeader = ({
	className,
	...props
}: React.HTMLAttributes<HTMLDivElement>) => (
	<div
		className={cn(
			"shrink-0 border-b border-border px-6 py-5 sm:rounded-t-2xl",
			className
		)}
		{...props}
	/>
);

const SheetTitle = React.forwardRef<
	React.ComponentRef<typeof SheetPrimitive.Title>,
	React.ComponentPropsWithoutRef<typeof SheetPrimitive.Title>
>(({ className, ...props }, ref) => (
	<SheetPrimitive.Title
		ref={ref}
		className={cn("text-lg font-semibold tracking-tight", className)}
		{...props}
	/>
));
SheetTitle.displayName = SheetPrimitive.Title.displayName;

const SheetDescription = React.forwardRef<
	React.ComponentRef<typeof SheetPrimitive.Description>,
	React.ComponentPropsWithoutRef<typeof SheetPrimitive.Description>
>(({ className, ...props }, ref) => (
	<SheetPrimitive.Description
		ref={ref}
		className={cn("text-sm leading-relaxed text-muted-foreground", className)}
		{...props}
	/>
));
SheetDescription.displayName = SheetPrimitive.Description.displayName;

export {
	Sheet,
	SheetClose,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
};
