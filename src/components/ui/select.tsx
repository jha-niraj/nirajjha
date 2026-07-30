"use client";

import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

const Select = SelectPrimitive.Root;
const SelectGroup = SelectPrimitive.Group;
const SelectValue = SelectPrimitive.Value;

const SelectTrigger = React.forwardRef<
	React.ComponentRef<typeof SelectPrimitive.Trigger>,
	React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
	<SelectPrimitive.Trigger
		ref={ref}
		className={cn(
			"flex h-11 w-full items-center justify-between rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none transition-colors",
			"placeholder:text-muted-foreground focus:border-foreground/40",
			"disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
			className
		)}
		{...props}
	>
		{children}
		<SelectPrimitive.Icon asChild>
			<ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 data-[state=open]:rotate-180" />
		</SelectPrimitive.Icon>
	</SelectPrimitive.Trigger>
));
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

const SelectScrollButton = ({
	dir,
	...props
}: React.ComponentPropsWithoutRef<
	typeof SelectPrimitive.ScrollUpButton
> & { dir: "up" | "down" }) => {
	const Cmp =
		dir === "up"
			? SelectPrimitive.ScrollUpButton
			: SelectPrimitive.ScrollDownButton;
	const Icon = dir === "up" ? ChevronUp : ChevronDown;
	return (
		<Cmp
			className="flex cursor-default items-center justify-center py-1"
			{...props}
		>
			<Icon className="size-4" />
		</Cmp>
	);
};

const SelectContent = React.forwardRef<
	React.ComponentRef<typeof SelectPrimitive.Content>,
	React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = "popper", ...props }, ref) => (
	<SelectPrimitive.Portal>
		<SelectPrimitive.Content
			ref={ref}
			position={position}
			className={cn(
				"relative z-[70] max-h-96 min-w-[8rem] overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-lg",
				"data-[state=open]:animate-in data-[state=closed]:animate-out",
				"data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
				"data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
				"data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2",
				position === "popper" &&
					"data-[side=bottom]:translate-y-1 data-[side=top]:-translate-y-1",
				className
			)}
			{...props}
		>
			<SelectScrollButton dir="up" />
			<SelectPrimitive.Viewport
				className={cn(
					"p-1",
					position === "popper" &&
						"h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]"
				)}
			>
				{children}
			</SelectPrimitive.Viewport>
			<SelectScrollButton dir="down" />
		</SelectPrimitive.Content>
	</SelectPrimitive.Portal>
));
SelectContent.displayName = SelectPrimitive.Content.displayName;

const SelectItem = React.forwardRef<
	React.ComponentRef<typeof SelectPrimitive.Item>,
	React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
	<SelectPrimitive.Item
		ref={ref}
		className={cn(
			"relative flex w-full cursor-pointer select-none items-center rounded-lg py-2 pl-3 pr-8 text-sm outline-none transition-colors",
			"focus:bg-muted focus:text-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
			className
		)}
		{...props}
	>
		<SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
		<span className="absolute right-2 flex size-3.5 items-center justify-center">
			<SelectPrimitive.ItemIndicator>
				<Check className="size-4" />
			</SelectPrimitive.ItemIndicator>
		</span>
	</SelectPrimitive.Item>
));
SelectItem.displayName = SelectPrimitive.Item.displayName;

export {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
};
