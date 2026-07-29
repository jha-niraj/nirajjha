import { cn } from "@/lib/utils";

interface MarqueeProps {
	className?: string;
	reverse?: boolean;
	pauseOnHover?: boolean;
	vertical?: boolean;
	/** How many copies of the children to render. 2 is enough for a seamless loop. */
	repeat?: number;
	children: React.ReactNode;
	[key: string]: unknown;
}

export function Marquee({
	className,
	reverse = false,
	pauseOnHover = false,
	vertical = false,
	repeat = 2,
	children,
	...props
}: MarqueeProps) {
	return (
		<div
			{...props}
			className={cn(
				"group flex overflow-hidden p-2 [--duration:40s] [--gap:1rem] [gap:var(--gap)]",
				vertical ? "flex-col" : "flex-row",
				className
			)}
		>
			{Array.from({ length: repeat }).map((_, i) => (
				<div
					key={i}
					className={cn(
						"flex shrink-0 justify-around [gap:var(--gap)]",
						vertical
							? "animate-marquee-vertical flex-col"
							: "animate-marquee flex-row",
						pauseOnHover && "group-hover:[animation-play-state:paused]",
						reverse && "[animation-direction:reverse]",
						// A marquee is decoration; respect the user's motion preference.
						"motion-reduce:animate-none"
					)}
				>
					{children}
				</div>
			))}
		</div>
	);
}

export default Marquee;
