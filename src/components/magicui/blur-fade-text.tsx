"use client";

import { cn } from "@/lib/utils";
import {
	AnimatePresence,
	motion,
	useReducedMotion,
	Variants,
} from "framer-motion";
import { useMemo } from "react";

interface BlurFadeTextProps {
	text: string;
	className?: string;
	variant?: {
		hidden: { y: number };
		visible: { y: number };
	};
	duration?: number;
	characterDelay?: number;
	delay?: number;
	yOffset?: number;
	animateByCharacter?: boolean;
	/**
	 * Element to render as. Defaults to a div, which is why the homepage was
	 * shipping with zero <h1>: the name is the page's heading and has to say so
	 * in the markup, not just look like one.
	 */
	as?: "div" | "h1" | "h2" | "p";
}

const BlurFadeText = ({
	text,
	className,
	variant,
	characterDelay = 0.03,
	delay = 0,
	yOffset = 8,
	animateByCharacter = false,
	as = "div",
}: BlurFadeTextProps) => {
	const reduced = useReducedMotion();

	const defaultVariants: Variants = reduced
		? {
				hidden: { opacity: 0 },
				visible: { opacity: 1 },
			}
		: {
				hidden: { y: yOffset, opacity: 0, filter: "blur(8px)" },
				// Lands at 0. It used to finish at -yOffset, which left the heading
				// permanently 8px above its layout position.
				visible: { y: 0, opacity: 1, filter: "blur(0px)" },
			};
	const combinedVariants = variant || defaultVariants;
	const characters = useMemo(() => Array.from(text), [text]);

	const Wrapper = as;

	if (animateByCharacter) {
		return (
			<Wrapper className="flex">
				<AnimatePresence>
					{characters.map((char, i) => (
						<motion.span
							key={i}
							initial="hidden"
							animate="visible"
							exit="hidden"
							variants={combinedVariants}
							transition={{
								delay: delay + i * characterDelay,
								duration: 0.4,
								ease: "easeOut",
							}}
							className={cn("inline-block", className)}
							style={{
								width: char.trim() === "" ? "0.2em" : "auto",
							}}
						>
							{char}
						</motion.span>
					))}
				</AnimatePresence>
			</Wrapper>
		);
	}

	return (
		<Wrapper className="flex">
			<AnimatePresence>
				<motion.span
					initial="hidden"
					animate="visible"
					exit="hidden"
					variants={combinedVariants}
					transition={{
						delay,
						duration: 0.4,
						ease: "easeOut",
					}}
					className={cn("inline-block", className)}
				>
					{text}
				</motion.span>
			</AnimatePresence>
		</Wrapper>
	);
};

export default BlurFadeText;
